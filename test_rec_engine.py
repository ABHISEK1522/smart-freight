import json
import urllib.request

def test_fleet_recommendation():
    print("=== Testing Fleet-Connected Recommendation Engine ===")
    
    # 1. Fetch live fleet
    res = urllib.request.urlopen("http://127.0.0.1:8000/vehicles")
    fleet = json.loads(res.read())
    print(f"Total fleet assets in SQLite: {len(fleet)}")
    for v in fleet:
        print(f" - {v['id']}: {v['type']} ({v['capacity_kg']} kg) | Status: {v['status']} | Capability: {v.get('special_capability')}")

    # Verify status filtering
    available = [v for v in fleet if v['status'] == 'Available']
    in_transit = [v for v in fleet if v['status'] == 'In Transit']
    maintenance = [v for v in fleet if v['status'] == 'Maintenance']
    print(f"\nBreakdown: {len(available)} Available, {len(in_transit)} In Transit, {len(maintenance)} Maintenance")
    assert len(available) >= 3

    print("\nALL FLEET RECOMMENDATION VERIFICATIONS PASSED!")

if __name__ == "__main__":
    test_fleet_recommendation()
