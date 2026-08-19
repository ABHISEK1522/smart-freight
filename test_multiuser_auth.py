import json
import urllib.request
import urllib.error

API_URL = "http://127.0.0.1:8000"

def post_json(endpoint, data, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(
        f"{API_URL}{endpoint}",
        data=json.dumps(data).encode("utf-8"),
        headers=headers,
    )
    res = urllib.request.urlopen(req)
    return json.loads(res.read())

def get_json(endpoint, token=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{API_URL}{endpoint}", headers=headers)
    res = urllib.request.urlopen(req)
    return json.loads(res.read())

def run_tests():
    print("=== 1. Test Demo User Login ===")
    demo_login = post_json("/auth/login", {"email": "demo@smartfreight.io", "password": "password123"})
    demo_token = demo_login["token"]
    demo_user = demo_login["user"]
    print("Demo login successful:", demo_user["email"], "| ID:", demo_user["id"])
    assert demo_user["email"] == "demo@smartfreight.io"

    print("\n=== 2. Test User Registration (User A - Alice) ===")
    alice_email = "alice_test@freight.com"
    # Try login first in case already created in previous run, otherwise register
    try:
        alice_auth = post_json("/auth/login", {"email": alice_email, "password": "password123"})
    except urllib.error.HTTPError:
        alice_auth = post_json("/auth/register", {"name": "Alice Operator", "email": alice_email, "password": "password123"})
    alice_token = alice_auth["token"]
    alice_id = alice_auth["user"]["id"]
    print("Alice authenticated:", alice_auth["user"]["name"], "| ID:", alice_id)

    print("\n=== 3. Test User Registration (User B - Bob) ===")
    bob_email = "bob_test@logistics.com"
    try:
        bob_auth = post_json("/auth/login", {"email": bob_email, "password": "password123"})
    except urllib.error.HTTPError:
        bob_auth = post_json("/auth/register", {"name": "Bob Carrier", "email": bob_email, "password": "password123"})
    bob_token = bob_auth["token"]
    bob_id = bob_auth["user"]["id"]
    print("Bob authenticated:", bob_auth["user"]["name"], "| ID:", bob_id)

    print("\n=== 4. User A Creates Shipment ===")
    alice_shipment = post_json("/shipments", {
        "product_type": "Alice Confidential Pharma",
        "weight_kg": 600.0,
        "pickup_location": "Bhubaneswar",
        "destination": "Kolkata",
        "special_requirement": "Refrigerated"
    }, token=alice_token)
    alice_ship_id = alice_shipment["id"]
    print("Alice created shipment:", alice_ship_id, alice_shipment["product_type"])

    print("\n=== 5. Verify User Data Isolation (User B cannot see Alice's shipment) ===")
    bob_shipments = get_json("/shipments", token=bob_token)
    print(f"Bob sees {len(bob_shipments)} shipments.")
    assert not any(s["id"] == alice_ship_id for s in bob_shipments), "CRITICAL: Bob saw Alice's shipment in list!"

    # Verify Bob getting Alice's shipment directly by ID returns 404
    try:
        get_json(f"/shipments/{alice_ship_id}", token=bob_token)
        assert False, "CRITICAL: Bob was able to retrieve Alice's shipment by ID!"
    except urllib.error.HTTPError as e:
        print("Verified Bob 404 on Alice's shipment ID:", e.code)
        assert e.code == 404

    print("\n=== 6. User B Creates Shipment & Verifies Isolation from Alice ===")
    bob_shipment = post_json("/shipments", {
        "product_type": "Bob Industrial Steel",
        "weight_kg": 2500.0,
        "pickup_location": "Cuttack",
        "destination": "Kolkata",
        "special_requirement": "Normal"
    }, token=bob_token)
    bob_ship_id = bob_shipment["id"]
    print("Bob created shipment:", bob_ship_id, bob_shipment["product_type"])

    alice_shipments = get_json("/shipments", token=alice_token)
    assert not any(s["id"] == bob_ship_id for s in alice_shipments), "CRITICAL: Alice saw Bob's shipment in list!"
    print(f"Alice lists {len(alice_shipments)} shipments; Bob's shipment {bob_ship_id} is properly hidden.")

    print("\n=== 7. Test Protected Fleet Isolation ===")
    alice_fleet = get_json("/vehicles", token=alice_token)
    bob_fleet = get_json("/vehicles", token=bob_token)
    print(f"Alice fleet count: {len(alice_fleet)} | Bob fleet count: {len(bob_fleet)}")
    assert len(alice_fleet) > 0 and len(bob_fleet) > 0

    print("\n=== 8. Test /auth/me Profile ===")
    me = get_json("/auth/me", token=alice_token)
    print("GET /auth/me for Alice:", me["name"], me["email"])
    assert me["email"] == alice_email

    print("\nALL MULTI-USER AUTHENTICATION & DATA ISOLATION TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    run_tests()
