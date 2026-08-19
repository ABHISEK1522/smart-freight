import json
import os
import sys
from datetime import datetime
import database
from main import app, create_or_save_shipment, list_all_shipments, get_shipment_by_id, update_existing_shipment, delete_shipment_by_id, optimize, ShipmentCreate, ShipmentUpdate

def run_tests():
    print("=== 1. Initializing SQLite Database ===")
    database.init_db()
    all_shipments = database.get_all_shipments()
    print(f"Total shipments in SQLite: {len(all_shipments)}")
    assert len(all_shipments) >= 3

    print("\n=== 2. Testing Create & Persist Shipment ===")
    create_payload = ShipmentCreate(
        product_type="Pharmaceutical Vaccines",
        weight_kg=450.0,
        pickup_location="Bhubaneswar",
        destination="Kolkata",
        pickup_date="2026-08-16",
        pickup_time="09:30",
        delivery_date="2026-08-17",
        delivery_time="14:00",
        delivery_priority="Urgent",
        special_requirement="Refrigerated",
        selected_vehicle="Refrigerated Van (Medium)",
        route=["Bhubaneswar", "Cuttack", "Jamshedpur", "Kolkata"],
        cost=14500.0,
        savings=14500.0,
        risk_percentage=35.0,
        eta="6.8 hrs",
        status="Planned"
    )
    created = create_or_save_shipment(create_payload)
    print("Created Shipment:", created)
    created_id = created["id"]
    assert created["product_type"] == "Pharmaceutical Vaccines"
    assert created["weight_kg"] == 450.0
    assert created["delivery_priority"] == "Urgent"

    print("\n=== 3. Testing Get All Shipments ===")
    shipments_list = list_all_shipments()
    print(f"Retrieved {len(shipments_list)} shipments from database.")
    assert any(s["id"] == created_id for s in shipments_list)

    print("\n=== 4. Testing Get One Shipment by ID ===")
    single = get_shipment_by_id(created_id)
    print(f"Retrieved Shipment by ID ({created_id}):", single)
    assert single["id"] == created_id
    assert single["product_type"] == "Pharmaceutical Vaccines"

    print("\n=== 5. Testing Update Shipment ===")
    update_payload = ShipmentUpdate(
        weight_kg=480.0,
        status="In Transit",
        cost=14000.0,
        savings=15000.0
    )
    updated = update_existing_shipment(created_id, update_payload)
    print(f"Updated Shipment ({created_id}):", updated)
    assert updated["weight_kg"] == 480.0
    assert updated["status"] == "In Transit"
    assert updated["cost"] == 14000.0

    print("\n=== 6. Testing Optimization over SQLite Shipments ===")
    opt_res = optimize()
    print(f"Optimization Output: {len(opt_res.trips)} trips generated, Total Savings: Rs. {opt_res.total_savings}")
    assert len(opt_res.trips) > 0

    print("\n=== 7. Testing Delete Shipment ===")
    del_res = delete_shipment_by_id(created_id)
    print("Delete Result:", del_res)
    assert del_res["id"] == created_id

    # Verify that get now raises 404
    try:
        get_shipment_by_id(created_id)
        assert False, "Should have raised 404"
    except Exception as e:
        print("Verified 404 on deleted ID:", e)

    print("\nALL SQLITE PERSISTENCE & API CRUD TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
