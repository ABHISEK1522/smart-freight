"""Comprehensive integration test suite for Driver Cargo Damage Reporting,
Incident Lifecycle, Telemetry Verification, and Future Damage-Risk ML Pipeline.
"""

import json
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8000"


def http_post(endpoint: str, data: dict, token: str = None) -> tuple[int, dict]:
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=5) as res:
            return res.status, json.loads(res.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())


def http_get(endpoint: str, token: str = None) -> tuple[int, dict]:
    url = f"{BASE_URL}{endpoint}"
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, headers=headers, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=5) as res:
            return res.status, json.loads(res.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())


def http_patch(endpoint: str, data: dict, token: str = None) -> tuple[int, dict]:
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=headers, method="PATCH")
    try:
        with urllib.request.urlopen(req, timeout=5) as res:
            return res.status, json.loads(res.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())


def run_incident_test_suite():
    print("=================================================================")
    print("SMART FREIGHT — DRIVER INCIDENT & DAMAGE ML INTEGRATION TEST")
    print("=================================================================")

    # 1. Login Driver and Customer
    print("\n--- 1. Authenticating Demo Driver & Consumer ---")
    d_status, d_data = http_post("/auth/login", {"email": "driver@smartfreight.io", "password": "password123"})
    assert d_status == 200, f"Driver login failed: {d_data}"
    driver_token = d_data["token"]
    print(f"[OK] Driver authenticated: {d_data['user']['name']}")

    c_status, c_data = http_post("/auth/login", {"email": "demo@smartfreight.io", "password": "password123"})
    assert c_status == 200, f"Customer login failed: {c_data}"
    customer_token = c_data["token"]
    print(f"[OK] Customer authenticated: {c_data['user']['name']}")

    # 2. Get assigned driver shipment
    print("\n--- 2. Fetching Driver Assigned Shipment ---")
    s_status, s_data = http_get("/driver/shipments", token=driver_token)
    assert s_status == 200 and len(s_data) > 0
    assigned_shipment_id = s_data[0]["id"]
    print(f"[OK] Driver assigned to shipment: {assigned_shipment_id}")

    # 3. Report Incident (REPORTED)
    print("\n--- 3. Driver Submits Incident Report ---")
    incident_payload = {
        "shipment_id": assigned_shipment_id,
        "vehicle_id": "VH-101",
        "incident_type": "Package Damage",
        "severity": "High",
        "description": "Crate crushed after sudden emergency braking on NH-16.",
        "photo_name": "evidence_damage_001.jpg",
        "timestamp": "2026-08-16T14:30:00",
        "source": "DRIVER_REPORT",
    }
    r_status, r_data = http_post("/incidents", incident_payload, token=driver_token)
    assert r_status == 201, f"Failed reporting incident: {r_data}"
    incident_id = r_data["id"]
    assert r_data["status"] == "REPORTED"
    assert r_data["is_verified_damage"] == 0  # Unverified until resolved
    print(f"[OK] Incident created: {incident_id} (Status: {r_data['status']}, Severity: {r_data['severity']})")

    # 4. Customer views incident
    print("\n--- 4. Customer Shipment Incident Visibility ---")
    ci_status, ci_data = http_get(f"/incidents/{assigned_shipment_id}", token=customer_token)
    assert ci_status == 200, f"Failed fetching customer incidents: {ci_data}"
    assert any(i["id"] == incident_id for i in ci_data)
    print(f"[OK] Customer retrieved incident list for {assigned_shipment_id}: {len(ci_data)} incident(s) visible")

    # 5. Incident Lifecycle: START INSPECTION
    print("\n--- 5. Driver Advances Incident to 'UNDER INSPECTION' ---")
    p1_status, p1_data = http_patch(f"/incidents/{incident_id}/status", {"status": "UNDER INSPECTION"}, token=driver_token)
    assert p1_status == 200
    assert p1_data["status"] == "UNDER INSPECTION"
    assert p1_data["inspected_at"] is not None
    print(f"[OK] Incident advanced to UNDER INSPECTION at {p1_data['inspected_at']}")

    # 6. Incident Lifecycle: MARK RESOLVED (Verified Operational Damage for Future ML)
    print("\n--- 6. Driver Resolves Incident (MARK RESOLVED) ---")
    p2_status, p2_data = http_patch(
        f"/incidents/{incident_id}/status",
        {
            "status": "RESOLVED",
            "resolution_note": "Cargo pallet re-stacked and secured. Packaging compromised but inner vials intact.",
        },
        token=driver_token,
    )
    assert p2_status == 200
    assert p2_data["status"] == "RESOLVED"
    assert p2_data["is_verified_damage"] == 1
    assert p2_data["resolution_note"] is not None
    print(f"[OK] Incident RESOLVED. Operational damage verified for Model 2 training dataset.")

    # 7. Telemetry Anomaly Evaluation & Human-in-the-loop Dismissal
    print("\n--- 7. Testing Telemetry Anomaly Detection & False Alarm Dismissal ---")
    te_status, te_data = http_post(
        "/telemetry/evaluate",
        {"shipment_id": assigned_shipment_id, "temperature": 11.5, "g_force": 2.8},
        token=driver_token,
    )
    assert te_status == 200
    assert te_data["has_alert"] is True
    assert len(te_data["anomalies"]) >= 2
    print(f"[OK] Telemetry detected {len(te_data['anomalies'])} anomalies -> Recommended: {te_data['recommended_action']}")

    # Dismiss alert
    td_status, td_data = http_post(
        "/telemetry/dismiss",
        {"shipment_id": assigned_shipment_id, "reason": "Sensor false spike during momentary door opening; seals intact."},
        token=driver_token,
    )
    assert td_status == 200
    assert td_data["dismissed"] is True
    assert td_data["is_verified_damage"] is False  # Dismissed alert != confirmed damage
    print(f"[OK] Driver dismissed telemetry alert. Alert NOT added as damage record.")

    # 8. Damage Risk ML Pipeline Status & Statistics
    print("\n--- 8. Testing Damage-Risk ML Pipeline Status & Historical Stats ---")
    st_status, st_data = http_get("/damage-risk/stats", token=customer_token)
    assert st_status == 200
    assert st_data["total_incidents"] > 0
    assert st_data["resolved_count"] > 0
    print(f"[OK] Historical damage stats: {st_data['total_incidents']} total, {st_data['resolved_count']} resolved")

    pipe_status, pipe_data = http_get("/damage-risk/pipeline-status")
    assert pipe_status == 200
    assert pipe_data["model_status"] == "COLLECTING DATA"
    assert pipe_data["verified_damage_samples"] >= 1
    print(f"[OK] Damage Model Pipeline Status: {pipe_data['model_status']} ({pipe_data['verified_damage_samples']}/{pipe_data['threshold_required']} verified samples)")
    print(f"     Notice: '{pipe_data['status_message']}'")

    print("\n=================================================================")
    print(">>> ALL INCIDENT & DAMAGE-RISK ML TESTS PASSED SUCCESSFULLY! <<<")
    print("=================================================================")


if __name__ == "__main__":
    run_incident_test_suite()
