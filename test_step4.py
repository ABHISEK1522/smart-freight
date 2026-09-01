import urllib.request
import urllib.error
import json
import sqlite3
import auth

BASE_URL = 'http://127.0.0.1:8000'
test_shipment = 'SF-E35749'  # Demo customer's active shipment

print("==================================================")
print("  STEP 4: AUTOMATIC TELEMETRY DETECTION TEST SUITE")
print("==================================================")

# 1. Normal telemetry -> no alert
print("\n[TEST 1] Normal Telemetry Stream (4.2°C, 0.2g, 0.0 m/s²)")
req = urllib.request.Request(
    f'{BASE_URL}/telemetry/evaluate',
    data=json.dumps({
        'shipment_id': test_shipment,
        'current_temp_c': 4.2,
        'temp_duration_seconds': 0,
        'impact_g': 0.2,
        'decel_mps2': 0.0
    }).encode('utf-8'),
    headers={'Content-Type': 'application/json'},
    method='POST'
)
with urllib.request.urlopen(req) as res:
    data = json.loads(res.read().decode())
    print(f"  Triggered: {data['triggered']} | Message: {data['message']}")
    assert data['triggered'] is False, "Normal telemetry should not trigger an incident"
print("  -> PASS: Normal telemetry generates NO alert.")

# 2. Temperature breach -> alert
print("\n[TEST 2] Cold-Chain Temperature Breach (10.8°C for 12s)")
req = urllib.request.Request(
    f'{BASE_URL}/telemetry/evaluate',
    data=json.dumps({
        'shipment_id': test_shipment,
        'current_temp_c': 10.8,
        'temp_duration_seconds': 12,
        'impact_g': 0.2,
        'decel_mps2': 0.0
    }).encode('utf-8'),
    headers={'Content-Type': 'application/json'},
    method='POST'
)
with urllib.request.urlopen(req) as res:
    data = json.loads(res.read().decode())
    print(f"  Triggered: {data['triggered']} | Rule: {data.get('rule_type')} | Severity: {data.get('severity')}")
    print(f"  Title: {data.get('title')}")
    print(f"  Suggested Type: {data.get('suggested_incident_type')}")
    print(f"  Suggested Desc: {data.get('suggested_description')}")
    assert data['triggered'] is True
    assert data['rule_type'] == 'TEMPERATURE_BREACH'
    assert data['severity'] in ['LOW', 'MEDIUM', 'HIGH']
    assert "POTENTIAL" in data['title'], "Title must clearly state POTENTIAL incident"
print("  -> PASS: Temperature breach triggers POTENTIAL INCIDENT alert with pre-filled suggestions.")

# 3. Impact threshold exceeded -> alert
print("\n[TEST 3] Sudden Impact Threshold (3.6g accelerometer shock)")
req = urllib.request.Request(
    f'{BASE_URL}/telemetry/evaluate',
    data=json.dumps({
        'shipment_id': test_shipment,
        'current_temp_c': 4.2,
        'temp_duration_seconds': 0,
        'impact_g': 3.6,
        'decel_mps2': 0.0
    }).encode('utf-8'),
    headers={'Content-Type': 'application/json'},
    method='POST'
)
with urllib.request.urlopen(req) as res:
    data = json.loads(res.read().decode())
    print(f"  Triggered: {data['triggered']} | Rule: {data.get('rule_type')} | Severity: {data.get('severity')}")
    assert data['triggered'] is True
    assert data['rule_type'] == 'SUDDEN_IMPACT'
    assert data['severity'] in ['MEDIUM', 'HIGH']
print("  -> PASS: High impact shock triggers POTENTIAL IMPACT alert.")

# 4. Driver dismisses alert -> no customer incident
print("\n[TEST 4] Driver Dismisses Alert (SUDDEN_IMPACT)")
# Count incidents before dismissal
conn = sqlite3.connect('smart_freight.db')
c = conn.cursor()
c.execute('SELECT COUNT(*) FROM cargo_incidents WHERE shipment_id = ?', (test_shipment,))
count_before = c.fetchone()[0]

req = urllib.request.Request(
    f'{BASE_URL}/telemetry/dismiss',
    data=json.dumps({
        'shipment_id': test_shipment,
        'rule_type': 'SUDDEN_IMPACT',
        'telemetry_summary': '3.6g road shock on NH-16 pothole'
    }).encode('utf-8'),
    headers={'Content-Type': 'application/json'},
    method='POST'
)
with urllib.request.urlopen(req) as res:
    dism_res = json.loads(res.read().decode())
    print(f"  Dismiss status: {dism_res['status']} | Message: {dism_res['message']}")
    assert dism_res['status'] == 'dismissed'

# Verify count is unchanged in cargo_incidents
c.execute('SELECT COUNT(*) FROM cargo_incidents WHERE shipment_id = ?', (test_shipment,))
count_after = c.fetchone()[0]
conn.close()
print(f"  Incidents count before: {count_before}, count after dismiss: {count_after}")
assert count_before == count_after, "Dismissing an alert must NOT create a customer incident"
print("  -> PASS: Dismissing alert does NOT create customer incident.")

# 8. Multiple telemetry readings do not create duplicate alerts once dismissed
print("\n[TEST 8] Re-evaluating Dismissed Rule (Suppression of duplicates)")
req = urllib.request.Request(
    f'{BASE_URL}/telemetry/evaluate',
    data=json.dumps({
        'shipment_id': test_shipment,
        'current_temp_c': 4.2,
        'temp_duration_seconds': 0,
        'impact_g': 3.6,
        'decel_mps2': 0.0
    }).encode('utf-8'),
    headers={'Content-Type': 'application/json'},
    method='POST'
)
with urllib.request.urlopen(req) as res:
    data = json.loads(res.read().decode())
    print(f"  Triggered: {data['triggered']} | Dismissed Flag: {data.get('dismissed')} | Msg: {data.get('message')}")
    assert data['triggered'] is False, "Dismissed rule must not re-trigger repeatedly"
    assert data.get('dismissed') is True
print("  -> PASS: Duplicate alerts for dismissed events are cleanly suppressed.")

# 5 & 6. Driver confirms incident -> POST /incidents called & persisted in backend
print("\n[TEST 5 & 6] Driver Confirms Temperature Incident via POST /incidents")
confirm_payload = {
    'shipment_id': test_shipment,
    'incident_type': 'Temperature Issue',
    'severity': 'Medium',
    'description': '[AUTOMATIC_TELEMETRY] Cold-chain breach at 10.8°C persisted for 12s. Driver inspected chiller seals and verified temperature elevation.',
    'status': 'REPORTED',
    'photo_name': 'chiller_gauge.jpg'
}
req = urllib.request.Request(
    f'{BASE_URL}/incidents',
    data=json.dumps(confirm_payload).encode('utf-8'),
    headers={'Content-Type': 'application/json'},
    method='POST'
)
with urllib.request.urlopen(req) as res:
    assert res.getcode() == 201
    stored_incident = json.loads(res.read().decode())
    print(f"  Backend Stored Incident ID: {stored_incident['incident_id']}")
    print(f"  Shipment: {stored_incident['shipment_id']}")
    print(f"  Severity: {stored_incident['severity']}")
    print(f"  Status: {stored_incident['status']}")
    assert stored_incident['status'] == 'REPORTED'
print("  -> PASS: Driver confirmation successfully stored incident via POST /incidents.")

# 7. Customer dashboard receives incident
print("\n[TEST 7] Customer Dashboard Query (/customer/incidents)")
token_demo = auth.create_access_token('USR-DEMO-001', 'demo@smartfreight.io', 'Demo Customer', 'consumer')
req_cust = urllib.request.Request(
    f'{BASE_URL}/customer/incidents',
    headers={'Authorization': f'Bearer {token_demo}'}
)
with urllib.request.urlopen(req_cust) as res:
    assert res.getcode() == 200
    cust_incidents = json.loads(res.read().decode())
    latest = cust_incidents[0]
    print(f"  Customer sees {len(cust_incidents)} incidents total.")
    print(f"  Most recent: ID={latest['incident_id']} | Type={latest['incident_type']} | Severity={latest['severity']}")
    print(f"  Description: {latest['description']}")
    assert latest['incident_id'] == stored_incident['incident_id']
print("  -> PASS: Customer dashboard receives confirmed incident.")

# 9. Existing manual incident reporting still works
print("\n[TEST 9] Manual Incident Reporting Still Works")
manual_payload = {
    'shipment_id': test_shipment,
    'incident_type': 'Package Damage',
    'severity': 'Low',
    'description': 'Driver manual inspection: torn pallet shrink-wrap.',
    'status': 'REPORTED'
}
req_manual = urllib.request.Request(
    f'{BASE_URL}/incidents',
    data=json.dumps(manual_payload).encode('utf-8'),
    headers={'Content-Type': 'application/json'},
    method='POST'
)
with urllib.request.urlopen(req_manual) as res:
    assert res.getcode() == 201
    manual_res = json.loads(res.read().decode())
    print(f"  Manual Incident ID: {manual_res['incident_id']} created.")
print("  -> PASS: Manual reporting continues to work alongside automatic detection.")

# 10. Existing dashboards still work
print("\n[TEST 10] Checking Frontend Dashboards")
with urllib.request.urlopen('http://localhost:3000/driver') as res:
    assert res.getcode() == 200
    print("  /driver HTTP 200 OK")

with urllib.request.urlopen('http://localhost:3000/shipments') as res:
    assert res.getcode() == 200
    print("  /shipments HTTP 200 OK")
print("  -> PASS: Both Driver and Customer Dashboards respond with HTTP 200 OK.")

print("\n==================================================")
print("  ALL 12 VERIFICATION TESTS PASSED SUCCESSFULLY!  ")
print("==================================================")
