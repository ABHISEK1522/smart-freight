"""
Smart Freight - Full Runtime Smoke Test Suite
Executes comprehensive runtime tests against the live running Next.js (port 3000)
and FastAPI (port 8000) instances without mocks.
"""

import sys
import json
import time
import urllib.request
import urllib.error
import sqlite3

API_BASE = "http://127.0.0.1:8000"
FRONTEND_BASE = "http://localhost:3000"

results = {
    "sections": {},
    "passed": 0,
    "failed": 0,
    "warnings": []
}

def record_test(section, name, passed, details=""):
    if section not in results["sections"]:
        results["sections"][section] = []
    status_str = "PASS" if passed else "FAIL"
    results["sections"][section].append({
        "name": name,
        "status": status_str,
        "details": details
    })
    if passed:
        results["passed"] += 1
    else:
        results["failed"] += 1
    print(f"[{status_str}] [{section}] {name}: {details}")

def http_request(url, method="GET", data=None, headers=None):
    req_headers = {"Content-Type": "application/json"}
    if headers:
        req_headers.update(headers)
    body = json.dumps(data).encode() if data is not None else None
    req = urllib.request.Request(url, data=body, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as res:
            raw = res.read().decode("utf-8", errors="ignore")
            try:
                parsed = json.loads(raw)
            except Exception:
                parsed = raw
            return res.getcode(), parsed, None
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="ignore")
        try:
            parsed = json.loads(raw)
        except Exception:
            parsed = raw
        return e.code, parsed, None
    except Exception as e:
        return 0, None, str(e)

print("=================================================================")
print("     STARTING COMPLETE SMART FREIGHT RUNTIME SMOKE TEST         ")
print("=================================================================")

# =================================================================
# 1. FRONTEND ROUTES RUNTIME TEST
# =================================================================
print("\n--- SECTION 1: FRONTEND ROUTES RUNTIME TEST ---")
routes = [
    "/",
    "/analytics",
    "/costs",
    "/design-lab",
    "/driver",
    "/fleet",
    "/login",
    "/risks",
    "/routes",
    "/shipments",
    "/test",
    "/vehicles",
]

for r in routes:
    code, content, err = http_request(f"{FRONTEND_BASE}{r}")
    if err:
        record_test("FRONTEND_ROUTES", f"Route {r}", False, f"Network error: {err}")
    elif code != 200:
        record_test("FRONTEND_ROUTES", f"Route {r}", False, f"HTTP {code}")
    else:
        # Check for Next.js error page artifacts in HTML
        has_runtime_error = "Unhandled Runtime Error" in content or "ReferenceError" in content or "TypeError" in content
        if has_runtime_error:
            record_test("FRONTEND_ROUTES", f"Route {r}", False, "Contains runtime error artifact in HTML")
        else:
            record_test("FRONTEND_ROUTES", f"Route {r}", True, f"HTTP 200, HTML length {len(content)} bytes")

# =================================================================
# 2. LOGIN / ROLE FLOW RUNTIME TEST
# =================================================================
print("\n--- SECTION 2: LOGIN & ROLE FLOW RUNTIME TEST ---")
# Consumer Login
code, con_data, err = http_request(f"{API_BASE}/auth/login", method="POST", data={"email": "demo@smartfreight.io", "password": "password123"})
con_token = con_data.get("token") if isinstance(con_data, dict) else None
con_user = con_data.get("user") if isinstance(con_data, dict) else {}
record_test("LOGIN_ROLE", "Consumer Login (demo@smartfreight.io)", code == 200 and con_user.get("role") == "consumer", f"Token issued, role={con_user.get('role')}")

# Driver Login
code, drv_data, err = http_request(f"{API_BASE}/auth/login", method="POST", data={"email": "driver@smartfreight.io", "password": "password123"})
drv_token = drv_data.get("token") if isinstance(drv_data, dict) else None
drv_user = drv_data.get("user") if isinstance(drv_data, dict) else {}
record_test("LOGIN_ROLE", "Driver Login (driver@smartfreight.io)", code == 200 and drv_user.get("role") == "driver", f"Token issued, role={drv_user.get('role')}")

# Protected route access check: /auth/me with consumer token
code, me_data, err = http_request(f"{API_BASE}/auth/me", headers={"Authorization": f"Bearer {con_token}"})
record_test("LOGIN_ROLE", "Protected /auth/me (Consumer)", code == 200 and me_data.get("email") == "demo@smartfreight.io", f"Authenticated user profile returned: {me_data.get('email')}")

# Protected route access check: /driver/me with driver token
code, drv_me_data, err = http_request(f"{API_BASE}/driver/me", headers={"Authorization": f"Bearer {drv_token}"})
record_test("LOGIN_ROLE", "Protected /driver/me (Driver)", code == 200 and drv_me_data.get("role") == "driver", f"Driver profile: vehicle={drv_me_data.get('assigned_vehicle')}, status={drv_me_data.get('driver_status')}")

# Unauthorized access check: consumer trying driver-only endpoint
code, denied_data, err = http_request(f"{API_BASE}/driver/me", headers={"Authorization": f"Bearer {con_token}"})
record_test("LOGIN_ROLE", "Unauthorized Consumer to /driver/me", code == 403, f"HTTP {code} correctly denied")

# Invalid token rejection
code, bad_tok_data, err = http_request(f"{API_BASE}/auth/me", headers={"Authorization": "Bearer invalid_token_xyz"})
record_test("LOGIN_ROLE", "Invalid Bearer Token Rejection", code == 401, f"HTTP {code} correctly rejected")

# =================================================================
# 3. SHIPMENT LIFECYCLE FLOW RUNTIME TEST
# =================================================================
print("\n--- SECTION 3: SHIPMENT LIFECYCLE FLOW RUNTIME TEST ---")
new_ship_payload = {
    "product_type": "Pharmaceutical Vaccines",
    "weight_kg": 420.0,
    "pickup_location": "Bhubaneswar",
    "destination": "Kolkata",
    "pickup_date": "2026-09-02",
    "pickup_time": "09:00",
    "delivery_date": "2026-09-03",
    "delivery_time": "18:00",
    "delivery_priority": "Express",
    "special_requirement": "Refrigerated",
    "selected_vehicle": "Refrigerated Van (Medium)"
}
code, created_ship, err = http_request(f"{API_BASE}/shipments", method="POST", data=new_ship_payload, headers={"Authorization": f"Bearer {con_token}"})
new_ship_id = created_ship.get("id") if isinstance(created_ship, dict) else None
record_test("SHIPMENT_FLOW", "Create New Shipment (POST /shipments)", code == 201 and new_ship_id is not None, f"Created ID: {new_ship_id}")

# Verify shipment appears in list
code, all_ships, err = http_request(f"{API_BASE}/shipments", headers={"Authorization": f"Bearer {con_token}"})
found_in_list = any(s.get("id") == new_ship_id for s in all_ships) if isinstance(all_ships, list) else False
record_test("SHIPMENT_FLOW", "Shipment Appears in List (GET /shipments)", found_in_list, f"Verified in customer list of {len(all_ships)} shipments")

# Verify tracking stages initialized
code, track_info, err = http_request(f"{API_BASE}/shipments/{new_ship_id}/tracking", headers={"Authorization": f"Bearer {con_token}"})
stages = track_info.get("stages", []) if isinstance(track_info, dict) else []
stage_names = [s.get("name") for s in stages]
record_test("SHIPMENT_FLOW", "Shipment Tracking Stages Initialized", code == 200 and "Planned" in stage_names, f"Stages: {stage_names}")

# Advance tracking stage
code, adv_track, err = http_request(f"{API_BASE}/shipments/{new_ship_id}/tracking/status", method="POST", headers={"Authorization": f"Bearer {con_token}"})
record_test("SHIPMENT_FLOW", "Advance Tracking Stage (POST /tracking/status)", code == 200 and adv_track.get("current_status") == "Dispatched", f"New status: {adv_track.get('current_status')}")

# =================================================================
# 4 & 5. MANUAL INCIDENT FLOW RUNTIME TEST
# =================================================================
print("\n--- SECTION 4 & 5: MANUAL INCIDENT FLOW RUNTIME TEST ---")
supported_types = [
    "Package Damage",
    "Temperature Issue",
    "Leakage / Spillage",
    "Accident / Impact",
    "Other"
]

for itype in supported_types:
    inc_payload = {
        "shipment_id": "SF-E35749",
        "incident_type": itype,
        "severity": "High" if itype in ["Temperature Issue", "Accident / Impact"] else "Medium",
        "description": f"Runtime smoke test for type: {itype}",
        "status": "REPORTED"
    }
    code, inc_res, err = http_request(f"{API_BASE}/incidents", method="POST", data=inc_payload, headers={"Authorization": f"Bearer {drv_token}"})
    inc_id = inc_res.get("incident_id") if isinstance(inc_res, dict) else None
    record_test("MANUAL_INCIDENT", f"Incident Type: {itype}", code == 201 and inc_id is not None, f"ID: {inc_id}, Type: {itype}")

# Validation test: Invalid severity
bad_sev_payload = {
    "shipment_id": "SF-E35749",
    "incident_type": "Package Damage",
    "severity": "Catastrophic",
    "description": "Invalid severity test"
}
code, bad_sev_res, err = http_request(f"{API_BASE}/incidents", method="POST", data=bad_sev_payload, headers={"Authorization": f"Bearer {drv_token}"})
record_test("MANUAL_INCIDENT", "Validation: Reject Invalid Severity", code == 422, f"HTTP {code} correctly rejected")

# Validation test: Invalid incident type
bad_type_payload = {
    "shipment_id": "SF-E35749",
    "incident_type": "Aliens Stole Cargo",
    "severity": "High",
    "description": "Invalid type test"
}
code, bad_type_res, err = http_request(f"{API_BASE}/incidents", method="POST", data=bad_type_payload, headers={"Authorization": f"Bearer {drv_token}"})
record_test("MANUAL_INCIDENT", "Validation: Reject Invalid Incident Type", code == 422, f"HTTP {code} correctly rejected")

# Validation test: Missing description
bad_desc_payload = {
    "shipment_id": "SF-E35749",
    "incident_type": "Package Damage",
    "severity": "High",
    "description": ""
}
code, bad_desc_res, err = http_request(f"{API_BASE}/incidents", method="POST", data=bad_desc_payload, headers={"Authorization": f"Bearer {drv_token}"})
record_test("MANUAL_INCIDENT", "Validation: Reject Empty Description", code == 422, f"HTTP {code} correctly rejected")

# =================================================================
# 6. TELEMETRY INCIDENT FLOW RUNTIME TEST
# =================================================================
print("\n--- SECTION 6: TELEMETRY INCIDENT FLOW RUNTIME TEST ---")
# 1. Normal telemetry
code, norm_res, err = http_request(f"{API_BASE}/telemetry/evaluate", method="POST", data={
    "shipment_id": "SF-E35749",
    "current_temp_c": 4.1,
    "temp_duration_seconds": 0,
    "impact_g": 0.2,
    "decel_mps2": 0.0
}, headers={"Authorization": f"Bearer {drv_token}"})
record_test("TELEMETRY_FLOW", "Normal Telemetry (No Alert)", code == 200 and not norm_res.get("triggered"), f"Triggered: {norm_res.get('triggered')}")

# 2. Temperature breach
code, temp_res, err = http_request(f"{API_BASE}/telemetry/evaluate", method="POST", data={
    "shipment_id": "SF-E35749",
    "current_temp_c": 11.5,
    "temp_duration_seconds": 12,
    "impact_g": 0.2
}, headers={"Authorization": f"Bearer {drv_token}"})
record_test("TELEMETRY_FLOW", "Temperature Breach Alert", code == 200 and temp_res.get("rule_type") == "TEMPERATURE_BREACH", f"Rule: {temp_res.get('rule_type')}, Severity: {temp_res.get('severity')}")

# 3. Sudden impact
code, imp_res, err = http_request(f"{API_BASE}/telemetry/evaluate", method="POST", data={
    "shipment_id": "SF-E35749",
    "current_temp_c": 4.0,
    "impact_g": 3.4
}, headers={"Authorization": f"Bearer {drv_token}"})
record_test("TELEMETRY_FLOW", "Sudden Impact Alert", code == 200 and imp_res.get("rule_type") == "SUDDEN_IMPACT", f"Rule: {imp_res.get('rule_type')}, Severity: {imp_res.get('severity')}")

# 4. Harsh braking
code, brk_res, err = http_request(f"{API_BASE}/telemetry/evaluate", method="POST", data={
    "shipment_id": "SF-E35749",
    "current_temp_c": 4.0,
    "decel_mps2": -7.2
}, headers={"Authorization": f"Bearer {drv_token}"})
record_test("TELEMETRY_FLOW", "Harsh Braking Alert", code == 200 and brk_res.get("rule_type") == "HARSH_BRAKING", f"Rule: {brk_res.get('rule_type')}, Severity: {brk_res.get('severity')}")

# 5. Dismissal & Suppression
code, dis_res, err = http_request(f"{API_BASE}/telemetry/dismiss", method="POST", data={
    "shipment_id": "SF-E35749",
    "rule_type": "HARSH_BRAKING",
    "telemetry_summary": "Dismissed by driver during smoke test"
}, headers={"Authorization": f"Bearer {drv_token}"})
record_test("TELEMETRY_FLOW", "Driver Dismissal (POST /telemetry/dismiss)", code == 200 and dis_res.get("status") == "dismissed", "Dismissal recorded in SQLite")

# Re-evaluate same harsh braking immediately -> must be suppressed!
code, supp_res, err = http_request(f"{API_BASE}/telemetry/evaluate", method="POST", data={
    "shipment_id": "SF-E35749",
    "current_temp_c": 4.0,
    "decel_mps2": -7.2
}, headers={"Authorization": f"Bearer {drv_token}"})
record_test("TELEMETRY_FLOW", "Suppression within 15min Window", code == 200 and supp_res.get("triggered") is False and supp_res.get("dismissed") is True, f"Alert suppressed: {supp_res.get('dismissed')}")

# =================================================================
# 7. CUSTOMER INCIDENT FLOW & STATUS PROGRESSION RUNTIME TEST
# =================================================================
print("\n--- SECTION 7: CUSTOMER INCIDENT & STATUS PROGRESSION ---")
# 1. Driver reports incident
code, cust_inc, err = http_request(f"{API_BASE}/incidents", method="POST", data={
    "shipment_id": "SF-E35749",
    "incident_type": "Temperature Issue",
    "severity": "High",
    "description": "Auxiliary cooling malfunction during transit on NH-16.",
    "status": "REPORTED"
}, headers={"Authorization": f"Bearer {drv_token}"})
test_inc_id = cust_inc.get("incident_id")
record_test("CUSTOMER_INCIDENT_FLOW", "1. Driver Reports Incident", code == 201 and test_inc_id is not None, f"ID: {test_inc_id}")

# 2. Customer sees it in REPORTED
code, c_incs_1, err = http_request(f"{API_BASE}/customer/incidents", headers={"Authorization": f"Bearer {con_token}"})
matched_1 = next((i for i in c_incs_1 if i.get("incident_id") == test_inc_id), None) if isinstance(c_incs_1, list) else None
record_test("CUSTOMER_INCIDENT_FLOW", "2. Customer Sees REPORTED Notification", matched_1 is not None and matched_1.get("status") == "REPORTED", f"Customer received: {matched_1.get('status') if matched_1 else 'None'}")

# 3. Driver advances to UNDER INSPECTION
code, patch_insp, err = http_request(f"{API_BASE}/incidents/{test_inc_id}/status", method="PATCH", data={"status": "UNDER INSPECTION"}, headers={"Authorization": f"Bearer {drv_token}"})
record_test("CUSTOMER_INCIDENT_FLOW", "3. Driver Advances to UNDER INSPECTION", code == 200 and patch_insp.get("status") == "UNDER INSPECTION", f"Inspected At: {patch_insp.get('inspected_at')}")

# 4. Customer verifies UNDER INSPECTION
code, c_incs_2, err = http_request(f"{API_BASE}/customer/incidents", headers={"Authorization": f"Bearer {con_token}"})
matched_2 = next((i for i in c_incs_2 if i.get("incident_id") == test_inc_id), None) if isinstance(c_incs_2, list) else None
record_test("CUSTOMER_INCIDENT_FLOW", "4. Customer Sees UNDER INSPECTION Update", matched_2 is not None and matched_2.get("status") == "UNDER INSPECTION", f"Inspected At: {matched_2.get('inspected_at') if matched_2 else 'None'}")

# 5. Driver resolves with note
code, patch_res, err = http_request(f"{API_BASE}/incidents/{test_inc_id}/status", method="PATCH", data={
    "status": "RESOLVED",
    "resolution_note": "Auxiliary refrigeration relay reset. Temperature stabilized at 4.2C."
}, headers={"Authorization": f"Bearer {drv_token}"})
record_test("CUSTOMER_INCIDENT_FLOW", "5. Driver Resolves Incident", code == 200 and patch_res.get("status") == "RESOLVED", f"Resolved At: {patch_res.get('resolved_at')}")

# 6. Customer verifies RESOLVED
code, c_incs_3, err = http_request(f"{API_BASE}/customer/incidents", headers={"Authorization": f"Bearer {con_token}"})
matched_3 = next((i for i in c_incs_3 if i.get("incident_id") == test_inc_id), None) if isinstance(c_incs_3, list) else None
record_test("CUSTOMER_INCIDENT_FLOW", "6. Customer Sees RESOLVED Notification", matched_3 is not None and matched_3.get("status") == "RESOLVED", f"Note: {matched_3.get('resolution_note') if matched_3 else 'None'}")

# =================================================================
# 8 & 9. MAP & ROUTING RUNTIME TEST
# =================================================================
print("\n--- SECTION 8 & 9: MAP & ROUTING RUNTIME TEST ---")
# 1. Standard Corridor Route
code, r_data, err = http_request(f"{API_BASE}/route?origin=Bhubaneswar&destination=Kolkata")
record_test("ROUTING", "Standard Corridor Route (Bhubaneswar -> Kolkata)", code == 200 and r_data.get("distance_km") == 440.3, f"Distance: {r_data.get('distance_km')} km, Dur: {r_data.get('duration_minutes'):.1f} min, Geometry: {len(r_data.get('route_geometry', []))} pts")

# 2. Intra-state Corridor Route (Puri -> Bhubaneswar)
code, r_data2, err = http_request(f"{API_BASE}/route?origin=Puri&destination=Bhubaneswar")
record_test("ROUTING", "Intra-state Route (Puri -> Bhubaneswar)", code == 200 and r_data2.get("distance_km") > 0, f"Distance: {r_data2.get('distance_km')} km, Dur: {r_data2.get('duration_minutes'):.1f} min")

# 3. Route POST endpoint
code, r_data_post, err = http_request(f"{API_BASE}/route", method="POST", data={"origin": "Cuttack", "destination": "Kolkata"})
record_test("ROUTING", "Route POST Endpoint (Cuttack -> Kolkata)", code == 200 and r_data_post.get("distance_km") > 0, f"Distance: {r_data_post.get('distance_km')} km")

# 4. Route with missing origin (should 400)
code, r_bad, err = http_request(f"{API_BASE}/route?destination=Kolkata")
record_test("ROUTING", "Validation: Missing Origin Query (HTTP 400)", code == 400, f"HTTP {code} correctly returned")

# =================================================================
# 10. DATA CONSISTENCY AUDIT
# =================================================================
print("\n--- SECTION 10: DATA CONSISTENCY AUDIT ---")
# Trace SF-E35749 across all modules
db_conn = sqlite3.connect("smart_freight.db")
db_cur = db_conn.cursor()

# 1. In SQLite
db_cur.execute("SELECT id, user_id, driver_id, status, pickup_location, destination FROM shipments WHERE id = 'SF-E35749'")
db_row = db_cur.fetchone()
record_test("DATA_CONSISTENCY", "Shipment SF-E35749 in SQLite", db_row is not None, f"Owner={db_row[1]}, Driver={db_row[2]}, Status={db_row[3]}")

# 2. In Driver Shipments API
code, drv_assigned, err = http_request(f"{API_BASE}/driver/shipments", headers={"Authorization": f"Bearer {drv_token}"})
drv_ship_ids = [s.get("id") for s in drv_assigned] if isinstance(drv_assigned, list) else []
record_test("DATA_CONSISTENCY", "SF-E35749 in Driver Assigned API", "SF-E35749" in drv_ship_ids, f"Present in driver assigned list: {'SF-E35749' in drv_ship_ids}")

# 3. In Customer Shipments API
code, cust_all, err = http_request(f"{API_BASE}/shipments", headers={"Authorization": f"Bearer {con_token}"})
cust_ship_ids = [s.get("id") for s in cust_all] if isinstance(cust_all, list) else []
record_test("DATA_CONSISTENCY", "SF-E35749 in Customer Shipments API", "SF-E35749" in cust_ship_ids, f"Present in customer list: {'SF-E35749' in cust_ship_ids}")

# 4. In Incidents Table
db_cur.execute("SELECT count(*) FROM cargo_incidents WHERE shipment_id = 'SF-E35749'")
inc_count = db_cur.fetchone()[0]
record_test("DATA_CONSISTENCY", "SF-E35749 Incidents Linked", inc_count > 0, f"{inc_count} incidents linked to SF-E35749 in database")
db_conn.close()

# =================================================================
# 13 & 14. PERSISTENCE & DATABASE INTEGRITY
# =================================================================
print("\n--- SECTION 13 & 14: PERSISTENCE & DATABASE INTEGRITY ---")
# Verify that test_inc_id is stored and queryable in SQLite directly
db_conn = sqlite3.connect("smart_freight.db")
db_cur = db_conn.cursor()
db_cur.execute("SELECT id, shipment_id, status, resolution_note, inspected_at, resolved_at FROM cargo_incidents WHERE id = ?", (test_inc_id,))
row = db_cur.fetchone()
db_conn.close()

record_test("PERSISTENCE", "Incident Stored in SQLite", row is not None, f"ID={row[0]}, Status={row[2]}, Note={row[3]}")
record_test("PERSISTENCE", "Lifecycle Timestamps Persisted", row is not None and row[4] is not None and row[5] is not None, f"Inspected={row[4] is not None}, Resolved={row[5] is not None}")

print("\n=================================================================")
print(f"SMOKE TEST COMPLETE: {results['passed']} PASSED, {results['failed']} FAILED")
print("=================================================================")
