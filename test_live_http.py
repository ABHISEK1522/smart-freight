import json
import urllib.request

def test_live_server():
    # 1. Test POST
    payload = {
        "product_type": "Fresh Apples",
        "weight_kg": 600.0,
        "pickup_location": "Bhubaneswar",
        "destination": "Kolkata",
        "pickup_date": "2026-08-16",
        "pickup_time": "08:30",
        "delivery_date": "2026-08-18",
        "delivery_time": "17:00",
        "delivery_priority": "Express",
        "special_requirement": "Refrigerated",
        "selected_vehicle": "Refrigerated Van (Medium)",
        "route": ["Bhubaneswar", "Cuttack", "Kolkata"],
        "cost": 14500.0,
        "savings": 14500.0,
        "risk_percentage": 42.0,
        "eta": "7.2 hrs",
        "status": "Planned"
    }
    req = urllib.request.Request(
        "http://127.0.0.1:8000/shipments",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    res = urllib.request.urlopen(req)
    assert res.status == 201
    created = json.loads(res.read())
    ship_id = created["id"]
    print("LIVE POST /shipments:", res.status, ship_id, created["product_type"])

    # 2. Test GET by ID
    res = urllib.request.urlopen(f"http://127.0.0.1:8000/shipments/{ship_id}")
    assert res.status == 200
    single = json.loads(res.read())
    print(f"LIVE GET /shipments/{ship_id}:", res.status, single["product_type"])

    # 3. Test PUT / PATCH
    update_data = {
        "weight_kg": 650.0,
        "status": "In Transit"
    }
    put_req = urllib.request.Request(
        f"http://127.0.0.1:8000/shipments/{ship_id}",
        data=json.dumps(update_data).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="PUT"
    )
    res = urllib.request.urlopen(put_req)
    assert res.status == 200
    updated = json.loads(res.read())
    print(f"LIVE PUT /shipments/{ship_id}:", res.status, updated["weight_kg"], updated["status"])

    # 4. Test DELETE
    del_req = urllib.request.Request(
        f"http://127.0.0.1:8000/shipments/{ship_id}",
        method="DELETE"
    )
    res = urllib.request.urlopen(del_req)
    assert res.status == 200
    del_msg = json.loads(res.read())
    print(f"LIVE DELETE /shipments/{ship_id}:", res.status, del_msg)

    print("\nALL LIVE HTTP FASTAPI ENDPOINTS VERIFIED!")

if __name__ == "__main__":
    test_live_server()
