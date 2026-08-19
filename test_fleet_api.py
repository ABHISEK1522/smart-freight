import json
import urllib.request

def test_vehicles():
    print("=== Testing Fleet Vehicles Endpoints ===")
    
    # 1. GET /vehicles
    res = urllib.request.urlopen("http://127.0.0.1:8000/vehicles")
    assert res.status == 200
    vehicles = json.loads(res.read())
    print(f"GET /vehicles: {len(vehicles)} vehicles found in SQLite.")
    assert len(vehicles) >= 3

    # 2. POST /vehicles (Add Vehicle)
    new_veh = {
        "id": "VH-999",
        "type": "Custom Rapid Reefer",
        "capacity_kg": 3200.0,
        "base_cost": 15500.0,
        "status": "Available",
        "special_capability": "Refrigerated / Cold-Chain",
        "is_refrigerated": True
    }
    req = urllib.request.Request(
        "http://127.0.0.1:8000/vehicles",
        data=json.dumps(new_veh).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    res = urllib.request.urlopen(req)
    assert res.status == 201
    created = json.loads(res.read())
    print("POST /vehicles:", res.status, created["id"], created["type"])
    assert created["id"] == "VH-999"

    # 3. GET /vehicles/{id}
    res = urllib.request.urlopen("http://127.0.0.1:8000/vehicles/VH-999")
    assert res.status == 200
    single = json.loads(res.read())
    print("GET /vehicles/VH-999:", res.status, single["type"])

    # 4. PUT / PATCH /vehicles/{id} (Edit Vehicle)
    update_data = {
        "status": "Maintenance",
        "base_cost": 15000.0
    }
    put_req = urllib.request.Request(
        "http://127.0.0.1:8000/vehicles/VH-999",
        data=json.dumps(update_data).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="PATCH"
    )
    res = urllib.request.urlopen(put_req)
    assert res.status == 200
    updated = json.loads(res.read())
    print("PATCH /vehicles/VH-999:", res.status, updated["status"], updated["base_cost"])
    assert updated["status"] == "Maintenance"

    # 5. DELETE /vehicles/{id}
    del_req = urllib.request.Request(
        "http://127.0.0.1:8000/vehicles/VH-999",
        method="DELETE"
    )
    res = urllib.request.urlopen(del_req)
    assert res.status == 200
    print("DELETE /vehicles/VH-999:", res.status)

    print("ALL FLEET BACKEND TESTS PASSED!")

if __name__ == "__main__":
    test_vehicles()
