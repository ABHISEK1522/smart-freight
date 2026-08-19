"""Test suite for Driver authentication, profile, shipment lifecycle, and strict authorization."""

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


def test_driver_suite():
    print("\n--- 1. Testing Demo Consumer Login ---")
    c_status, c_data = http_post("/auth/login", {"email": "demo@smartfreight.io", "password": "password123"})
    assert c_status == 200, f"Expected 200, got {c_status}: {c_data}"
    consumer_token = c_data["token"]
    consumer_user = c_data["user"]
    assert consumer_user["role"] == "consumer", f"Expected consumer role, got {consumer_user['role']}"
    print(f"[OK] Consumer login success: {consumer_user['name']} (role: {consumer_user['role']})")

    print("\n--- 2. Testing Demo Driver Login ---")
    d_status, d_data = http_post("/auth/login", {"email": "driver@smartfreight.io", "password": "password123"})
    assert d_status == 200, f"Expected 200, got {d_status}: {d_data}"
    driver_token = d_data["token"]
    driver_user = d_data["user"]
    assert driver_user["role"] == "driver", f"Expected driver role, got {driver_user['role']}"
    assert driver_user["assigned_vehicle"] == "Refrigerated Van (Medium)"
    print(f"[OK] Driver login success: {driver_user['name']} (role: {driver_user['role']}, vehicle: {driver_user['assigned_vehicle']})")

    print("\n--- 3. Testing Driver Profile Endpoint (GET & PATCH /driver/me) ---")
    dp_status, dp_data = http_get("/driver/me", token=driver_token)
    assert dp_status == 200, f"Expected 200, got {dp_status}: {dp_data}"
    assert dp_data["role"] == "driver"

    # Consumer cannot access GET /driver/me
    cp_status, cp_data = http_get("/driver/me", token=consumer_token)
    assert cp_status == 403, f"Expected 403 Forbidden for consumer on driver endpoint, got {cp_status}"
    print("[OK] Consumer strictly forbidden from driver endpoints (403 Forbidden)")

    # Update driver status
    patch_status, patch_data = http_patch("/driver/me", {"driver_status": "On Duty"}, token=driver_token)
    assert patch_status == 200
    assert patch_data["driver_status"] == "On Duty"
    print("[OK] Driver status updated to 'On Duty'")

    print("\n--- 4. Testing Driver Assigned Shipments (GET /driver/shipments) ---")
    ds_status, ds_data = http_get("/driver/shipments", token=driver_token)
    assert ds_status == 200, f"Expected 200, got {ds_status}: {ds_data}"
    assert len(ds_data) > 0, "Expected at least 1 assigned shipment for driver"
    active_shipment = ds_data[0]
    shipment_id = active_shipment["id"]
    print(f"[OK] Driver retrieved assigned shipment: {shipment_id} ({active_shipment['product_type']}, {active_shipment['pickup_location']} -> {active_shipment['destination']})")

    print("\n--- 5. Testing Driver Shipment Status Lifecycle Progression ---")
    # Progression: Assigned -> Accepted -> Picked Up -> In Transit -> Arrived -> Delivered
    lifecycle = ["Accepted", "Picked Up", "In Transit", "Arrived", "Delivered"]
    for stage in lifecycle:
        st_status, st_data = http_patch(f"/driver/shipments/{shipment_id}/status", {"status": stage}, token=driver_token)
        assert st_status == 200, f"Failed at stage {stage}: {st_data}"
        assert st_data["status"] == stage, f"Expected {stage}, got {st_data['status']}"
        print(f"  [OK] Advanced to: {stage}")

    print("\n--- 6. Testing Driver Authorization (Cannot modify another driver's shipment) ---")
    # Register Driver 2
    d2_reg_status, d2_reg_data = http_post("/auth/register", {
        "name": "Bikram Singh",
        "email": "driver2@smartfreight.io",
        "password": "password123",
        "role": "driver",
        "assigned_vehicle": "Standard Freight Truck",
    })
    assert d2_reg_status in (201, 400)
    if d2_reg_status == 201:
        d2_token = d2_reg_data["token"]
    else:
        _, d2_login = http_post("/auth/login", {"email": "driver2@smartfreight.io", "password": "password123"})
        d2_token = d2_login["token"]

    # Driver 2 attempts to modify Driver 1's shipment -> Expect 403 Forbidden
    auth_test_status, auth_test_data = http_patch(f"/driver/shipments/{shipment_id}/status", {"status": "Accepted"}, token=d2_token)
    assert auth_test_status == 403, f"Expected 403 Forbidden, got {auth_test_status}: {auth_test_data}"
    print("[OK] Driver 2 rejected with 403 Forbidden when attempting to modify Driver 1's shipment")

    print("\n=======================================================")
    print("ALL DRIVER AUTH & WORKFLOW TESTS PASSED SUCCESSFULLY! [OK]")
    print("=======================================================")


if __name__ == "__main__":
    test_driver_suite()
