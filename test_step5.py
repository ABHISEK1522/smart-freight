import urllib.request
import urllib.error
import json
import sqlite3
import auth

BASE_URL = 'http://127.0.0.1:8000'
test_shipment = 'SF-E35749'  # Demo customer shipment

print("==================================================")
print("  STEP 5: INCIDENT STATUS UPDATES & COMMUNICATION")
print("==================================================")

# 1. Create incident
print("\n[TEST 1] Create Cargo Incident (Initial Status: REPORTED)")
payload_create = {
    'shipment_id': test_shipment,
    'incident_type': 'Package Damage',
    'severity': 'HIGH',
    'description': 'Driver noted damaged outer carton on lower pallet.',
    'status': 'REPORTED',
    'photo_name': 'carton_damage.jpg'
}
req = urllib.request.Request(
    f'{BASE_URL}/incidents',
    data=json.dumps(payload_create).encode('utf-8'),
    headers={'Content-Type': 'application/json'},
    method='POST'
)
with urllib.request.urlopen(req) as res:
    assert res.getcode() == 201
    inc_data = json.loads(res.read().decode())
    inc_id = inc_data['incident_id']
    print(f"  Created Incident ID: {inc_id} | Status: {inc_data['status']}")
    assert inc_data['status'] == 'REPORTED'
print("  -> PASS: Incident created with status REPORTED.")

# 2. Driver sees incident on active shipment
print("\n[TEST 2] Driver Retrieves Active Shipment Incidents")
with urllib.request.urlopen(f'{BASE_URL}/incidents/{test_shipment}') as res:
    assert res.getcode() == 200
    shipment_incidents = json.loads(res.read().decode())
    found = any(i['incident_id'] == inc_id for i in shipment_incidents)
    print(f"  Driver sees {len(shipment_incidents)} incidents on {test_shipment}. New incident found: {found}")
    assert found
print("  -> PASS: Driver retrieves newly reported incident.")

# 3. Driver starts inspection -> PATCH /incidents/{incident_id}/status
print("\n[TEST 3] Driver Starts Inspection (UNDER INSPECTION)")
patch_inspect_req = urllib.request.Request(
    f'{BASE_URL}/incidents/{inc_id}/status',
    data=json.dumps({'status': 'UNDER INSPECTION'}).encode('utf-8'),
    headers={'Content-Type': 'application/json'},
    method='PATCH'
)
with urllib.request.urlopen(patch_inspect_req) as res:
    assert res.getcode() == 200
    updated_inspect = json.loads(res.read().decode())
    print(f"  Updated Status: {updated_inspect['status']} | Inspected At: {updated_inspect['inspected_at']}")
    assert updated_inspect['status'] == 'UNDER INSPECTION'
    assert updated_inspect['inspected_at'] is not None
print("  -> PASS: Backend transitioned status to UNDER INSPECTION with inspected_at timestamp.")

# 4. Customer sees UNDER INSPECTION
print("\n[TEST 4] Customer Dashboard Sees UNDER INSPECTION")
token_demo = auth.create_access_token('USR-DEMO-001', 'demo@smartfreight.io', 'Demo Customer', 'consumer')
req_cust = urllib.request.Request(
    f'{BASE_URL}/customer/incidents',
    headers={'Authorization': f'Bearer {token_demo}'}
)
with urllib.request.urlopen(req_cust) as res:
    assert res.getcode() == 200
    cust_incidents = json.loads(res.read().decode())
    matching = next((i for i in cust_incidents if i['incident_id'] == inc_id), None)
    assert matching is not None
    print(f"  Customer retrieved incident {matching['incident_id']}: status = {matching['status']}")
    assert matching['status'] == 'UNDER INSPECTION'
print("  -> PASS: Customer dashboard receives UNDER INSPECTION update.")

# 5. Driver resolves incident with resolution note
print("\n[TEST 5] Driver Marks Incident RESOLVED with Resolution Note")
patch_resolve_req = urllib.request.Request(
    f'{BASE_URL}/incidents/{inc_id}/status',
    data=json.dumps({
        'status': 'RESOLVED',
        'resolution_note': 'Damaged outer packaging inspected. Internal produce unaffected and resealed.'
    }).encode('utf-8'),
    headers={'Content-Type': 'application/json'},
    method='PATCH'
)
with urllib.request.urlopen(patch_resolve_req) as res:
    assert res.getcode() == 200
    updated_resolve = json.loads(res.read().decode())
    print(f"  Updated Status: {updated_resolve['status']}")
    print(f"  Resolution Note: {updated_resolve['resolution_note']}")
    print(f"  Resolved At: {updated_resolve['resolved_at']}")
    assert updated_resolve['status'] == 'RESOLVED'
    assert 'unaffected' in updated_resolve['resolution_note']
    assert updated_resolve['resolved_at'] is not None
print("  -> PASS: Backend transitioned status to RESOLVED with note and timestamp.")

# 6. Customer sees RESOLVED
print("\n[TEST 6] Customer Dashboard Sees RESOLVED")
with urllib.request.urlopen(req_cust) as res:
    assert res.getcode() == 200
    cust_incidents = json.loads(res.read().decode())
    matching = next((i for i in cust_incidents if i['incident_id'] == inc_id), None)
    assert matching is not None
    print(f"  Customer retrieved incident {matching['incident_id']}: status = {matching['status']}")
    print(f"  Customer sees resolution note: \"{matching['resolution_note']}\"")
    assert matching['status'] == 'RESOLVED'
print("  -> PASS: Customer dashboard receives RESOLVED status and driver resolution note.")

# 7. Persistence verification after fresh SQLite connection
print("\n[TEST 7] Direct SQLite Persistence Verification")
conn = sqlite3.connect('smart_freight.db')
cursor = conn.cursor()
cursor.execute("SELECT status, inspected_at, resolved_at, resolution_note FROM cargo_incidents WHERE id = ?", (inc_id,))
db_row = cursor.fetchone()
conn.close()
print(f"  Persisted DB Row: status={db_row[0]}, inspected_at={db_row[1]}, resolved_at={db_row[2]}")
assert db_row[0] == 'RESOLVED'
assert db_row[1] is not None
assert db_row[2] is not None
assert 'unaffected' in db_row[3]
print("  -> PASS: Incident lifecycle changes are permanently persisted in SQLite.")

# 8. Test Invalid Status Validation (422)
print("\n[TEST 8] Validation: Invalid Status Value (Expected 422)")
try:
    bad_req = urllib.request.Request(
        f'{BASE_URL}/incidents/{inc_id}/status',
        data=json.dumps({'status': 'ARBITRARY_STATUS'}).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='PATCH'
    )
    urllib.request.urlopen(bad_req)
    assert False, "Should have failed with 422"
except urllib.error.HTTPError as e:
    print(f"  Rejected with HTTP {e.code}: {e.reason}")
    assert e.code == 422
print("  -> PASS: Invalid status rejected with HTTP 422.")

# 9. Test Non-existent Incident (404)
print("\n[TEST 9] Non-existent Incident (Expected 404)")
try:
    missing_req = urllib.request.Request(
        f'{BASE_URL}/incidents/INC-NONEXISTENT99/status',
        data=json.dumps({'status': 'RESOLVED'}).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='PATCH'
    )
    urllib.request.urlopen(missing_req)
    assert False, "Should have failed with 404"
except urllib.error.HTTPError as e:
    print(f"  Rejected with HTTP {e.code}: {e.reason}")
    assert e.code == 404
print("  -> PASS: Non-existent incident rejected with HTTP 404.")

# 10. Automatic Telemetry & Manual Reporting Co-existence
print("\n[TEST 10] Automatic Telemetry & Manual Incident Compatibility")
telemetry_req = urllib.request.Request(
    f'{BASE_URL}/telemetry/evaluate',
    data=json.dumps({
        'shipment_id': test_shipment,
        'current_temp_c': 11.2,
        'temp_duration_seconds': 14,
        'impact_g': 0.1
    }).encode('utf-8'),
    headers={'Content-Type': 'application/json'},
    method='POST'
)
with urllib.request.urlopen(telemetry_req) as res:
    t_data = json.loads(res.read().decode())
    print(f"  Telemetry Detection Triggered: {t_data['triggered']} | Rule: {t_data.get('rule_type')}")
    assert t_data['triggered'] is True
print("  -> PASS: Automatic telemetry detection continues to work smoothly.")

# 11. Frontend endpoints health
print("\n[TEST 11] Checking Dashboard Endpoints")
with urllib.request.urlopen('http://localhost:3000/driver') as res:
    assert res.getcode() == 200
    print("  /driver: 200 OK")
with urllib.request.urlopen('http://localhost:3000/shipments') as res:
    assert res.getcode() == 200
    print("  /shipments: 200 OK")
print("  -> PASS: Both dashboards accessible with HTTP 200.")

print("\n==================================================")
print("  ALL STEP 5 VERIFICATION TESTS PASSED!          ")
print("==================================================")
