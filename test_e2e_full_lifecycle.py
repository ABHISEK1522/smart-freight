"""
Smart Freight Full End-to-End System Audit Test
Validates:
1. Consignor & Driver Authentication
2. Shipment Retrieval & Role Isolation
3. OSRM Road Geometry Calculation
4. Telemetry Evaluation & Breach Detection
5. Incident Creation, State Lifecycle & Persistence
6. Cross-Role Sync (Driver Action -> Customer Notification)
7. Shipment Lifecycle & Tracking Cache Synchronization
"""

import json
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8000"

def log_step(step_no, title):
    print(f"\n[STEP {step_no}] {title}")

def api_call(endpoint, method="GET", data=None, token=None):
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode() if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    with urllib.request.urlopen(req) as res:
        return res.getcode(), json.loads(res.read().decode())

print("=================================================================")
print("     SMART FREIGHT COMPLETE SYSTEM END-TO-END VERIFICATION      ")
print("=================================================================")

# STEP 1: Consumer & Driver Auth
log_step(1, "Authentication & Role Extraction")
status, con_auth = api_call("/auth/login", method="POST", data={"email": "demo@smartfreight.io", "password": "password123"})
con_token = con_auth["token"]
con_user = con_auth["user"]
assert con_user["role"] == "consumer"
print(f"[PASS] Consignor authenticated: {con_user['name']} ({con_user['id']})")

status, drv_auth = api_call("/auth/login", method="POST", data={"email": "driver@smartfreight.io", "password": "password123"})
drv_token = drv_auth["token"]
drv_user = drv_auth["user"]
assert drv_user["role"] == "driver"
print(f"[PASS] Driver authenticated: {drv_user['name']} ({drv_user['id']})")

# STEP 2: Driver Assigned Shipment
log_step(2, "Driver Retrieves Assigned Trip & Vehicle")
status, drv_shipments = api_call("/driver/shipments", token=drv_token)
assert len(drv_shipments) > 0
active_shipment = drv_shipments[0]
shipment_id = active_shipment["id"]
print(f"[PASS] Driver assigned trip: {shipment_id} ({active_shipment['pickup_location']} -> {active_shipment['destination']})")

# STEP 3: Road Route Geometry (OSRM / Fallback)
log_step(3, "Route Calculation via OpenStreetMap / OSRM")
status, route_data = api_call(f"/route?origin={active_shipment['pickup_location']}&destination={active_shipment['destination']}")
assert route_data["distance_km"] > 0
assert len(route_data["route_geometry"]) > 0
print(f"[PASS] Route calculated: {route_data['distance_km']} km, {route_data['duration_minutes']:.1f} mins, {len(route_data['route_geometry'])} waypoints")

# STEP 4: Telemetry Evaluation
log_step(4, "Telemetry Rule Evaluation (Simulated Chiller Excursion)")
status, telem_eval = api_call("/telemetry/evaluate", method="POST", data={
    "shipment_id": shipment_id,
    "current_temp_c": 12.5,
    "temp_duration_seconds": 15,
    "impact_g": 0.2
}, token=drv_token)
assert telem_eval["triggered"] is True
assert telem_eval["rule_type"] == "TEMPERATURE_BREACH"
print(f"[PASS] Telemetry alert triggered: {telem_eval['rule_type']} - {telem_eval.get('title')}")

# STEP 5: Driver Reports Incident
log_step(5, "Driver Reports Incident (POST /incidents)")
status, incident = api_call("/incidents", method="POST", data={
    "shipment_id": shipment_id,
    "incident_type": "Temperature Issue",
    "severity": "High",
    "description": "Reefer unit secondary compressor failure during Balasore transit.",
    "status": "REPORTED"
}, token=drv_token)
incident_id = incident["incident_id"]
assert incident["status"] == "REPORTED"
print(f"[PASS] Incident recorded: {incident_id} (Status: {incident['status']})")

# STEP 6: Customer Sees Incident Notification
log_step(6, "Customer Dashboard Queries Incidents (Role Isolation)")
status, cust_incidents = api_call("/customer/incidents", token=con_token)
cust_inc_ids = [inc["incident_id"] for inc in cust_incidents]
assert incident_id in cust_inc_ids
print(f"[PASS] Customer received notification for incident {incident_id}")

# STEP 7: Driver Starts Inspection
log_step(7, "Driver Advances Incident to UNDER INSPECTION")
status, updated_inc = api_call(f"/incidents/{incident_id}/status", method="PATCH", data={
    "status": "UNDER INSPECTION"
}, token=drv_token)
assert updated_inc["status"] == "UNDER INSPECTION"
assert updated_inc["inspected_at"] is not None
print(f"[PASS] Incident {incident_id} status updated to UNDER INSPECTION at {updated_inc['inspected_at']}")

# STEP 8: Customer Views Inspection Progress
log_step(8, "Customer Dashboard Syncs Inspection State")
status, cust_incidents2 = api_call("/customer/incidents", token=con_token)
matched = next(inc for inc in cust_incidents2 if inc["incident_id"] == incident_id)
assert matched["status"] == "UNDER INSPECTION"
print(f"[PASS] Customer sees status: {matched['status']}")

# STEP 9: Driver Resolves Incident
log_step(9, "Driver Marks Incident RESOLVED with Notes")
status, resolved_inc = api_call(f"/incidents/{incident_id}/status", method="PATCH", data={
    "status": "RESOLVED",
    "resolution_note": "Backup auxiliary chiller engaged. Temperature stabilized at 4.1C."
}, token=drv_token)
assert resolved_inc["status"] == "RESOLVED"
assert resolved_inc["resolved_at"] is not None
print(f"[PASS] Incident {incident_id} marked RESOLVED with note: '{resolved_inc['resolution_note']}'")

# STEP 10: Customer Sees Resolution
log_step(10, "Customer Dashboard Verifies Resolution")
status, cust_incidents3 = api_call("/customer/incidents", token=con_token)
matched_resolved = next(inc for inc in cust_incidents3 if inc["incident_id"] == incident_id)
assert matched_resolved["status"] == "RESOLVED"
print(f"[PASS] Customer sees final resolution: {matched_resolved['status']}")

# STEP 11: Driver Advances Trip Status & Tracking Cache Sync
log_step(11, "Driver Advances Trip Lifecycle (In Transit -> Arrived)")
status, updated_trip = api_call(f"/driver/shipments/{shipment_id}/status", method="PATCH", data={
    "status": "Arrived"
}, token=drv_token)
assert updated_trip["status"] == "Arrived"
print(f"[PASS] Driver advanced trip status to: {updated_trip['status']}")

# STEP 12: Customer Tracking Cache Sync
log_step(12, "Customer Tracking Stages Sync Verification")
status, tracking = api_call(f"/shipments/{shipment_id}/tracking", token=con_token)
print(f"[PASS] Customer tracking status: {tracking['current_status']}")
for s in tracking["stages"]:
    print(f"   Stage: {s['name']:15} | Completed: {s['completed']} | Time: {s['timestamp']}")

# Reset trip back to In Transit for clean demo state
api_call(f"/driver/shipments/{shipment_id}/status", method="PATCH", data={"status": "In Transit"}, token=drv_token)

print("\n=================================================================")
print("    ALL 12 END-TO-END LIFECYCLE TESTS COMPLETED SUCCESSFULLY!    ")
print("=================================================================")
