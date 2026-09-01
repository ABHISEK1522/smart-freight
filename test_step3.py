import urllib.request
import urllib.error
import json
import sqlite3
import auth

BASE_URL = 'http://127.0.0.1:8000'

print('=== 1. VERIFYING FASTAPI LIVE SERVER ===')
with urllib.request.urlopen(f'{BASE_URL}/health') as res:
    assert res.getcode() == 200
    print('Health OK:', json.loads(res.read().decode()))

print('\n=== 2. VERIFYING NEXT.JS FRONTEND ===')
with urllib.request.urlopen('http://localhost:3000/shipments') as res:
    assert res.getcode() == 200
    print('Customer Dashboard /shipments HTTP 200 OK')

with urllib.request.urlopen('http://localhost:3000/driver') as res:
    assert res.getcode() == 200
    print('Driver Dashboard /driver HTTP 200 OK')

print('\n=== 3. REPORTING TEST INCIDENTS (LOW, MEDIUM, HIGH) ===')
test_shipment = 'SF-E35749'  # Belongs to demo customer USR-DEMO-001

severities = [
    ('Low', 'Minor carton scuff on pallet outer wrap during transit.'),
    ('Medium', 'Temperature reading temporarily fluctuating between 6C and 8C.'),
    ('High', 'Severe impact damage observed on pallet 3; crate cracked.')
]

created_ids = []
for sev, desc in severities:
    payload = {
        'shipment_id': test_shipment,
        'incident_type': 'Package Damage' if ('carton' in desc or 'crate' in desc) else 'Temperature Issue',
        'severity': sev,
        'description': desc,
        'status': 'REPORTED',
        'photo_name': f'{sev.lower()}_damage.jpg'
    }
    req = urllib.request.Request(
        f'{BASE_URL}/incidents',
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    with urllib.request.urlopen(req) as res:
        assert res.getcode() == 201
        data = json.loads(res.read().decode())
        created_ids.append(data['incident_id'])
        print(f"Created {sev} incident: ID={data['incident_id']}, Shipment={data['shipment_id']}, Status={data['status']}")

print('\n=== 4. CONFIRMING SQLITE PERSISTENCE ===')
conn = sqlite3.connect('smart_freight.db')
cursor = conn.cursor()
cursor.execute('SELECT COUNT(*) FROM cargo_incidents WHERE shipment_id = ?', (test_shipment,))
count = cursor.fetchone()[0]
print(f'Total incidents in SQLite for {test_shipment}: {count}')
assert count >= 3
conn.close()

print('\n=== 5. CONFIRMING CUSTOMER INCIDENT RETRIEVAL (/customer/incidents) ===')
token_demo = auth.create_access_token('USR-DEMO-001', 'demo@smartfreight.io', 'Demo Customer', 'consumer')
req_cust = urllib.request.Request(
    f'{BASE_URL}/customer/incidents',
    headers={'Authorization': f'Bearer {token_demo}'}
)
with urllib.request.urlopen(req_cust) as res:
    assert res.getcode() == 200
    cust_incidents = json.loads(res.read().decode())
    print(f'Demo Customer retrieved {len(cust_incidents)} incidents across their shipments.')
    latest = cust_incidents[0]
    print('Latest incident details:')
    print('  ID:', latest['incident_id'])
    print('  Shipment:', latest['shipment_id'])
    print('  Cargo:', latest.get('product_type'))
    print('  Severity:', latest['severity'])
    print('  Description:', latest['description'])
    print('  Status:', latest['status'])
    print('  Photo File:', latest.get('photo_name'))
    assert latest['incident_id'] == created_ids[-1]

print('\n=== 6. CONFIRMING SECURITY / MULTI-TENANT ISOLATION ===')
token_alice = auth.create_access_token('USR-7A0E8BB9', 'alice@pharma.com', 'Alice Customer', 'consumer')
req_alice = urllib.request.Request(
    f'{BASE_URL}/customer/incidents',
    headers={'Authorization': f'Bearer {token_alice}'}
)
with urllib.request.urlopen(req_alice) as res:
    alice_inc = json.loads(res.read().decode())
    print(f'Alice retrieved {len(alice_inc)} incidents (expected 0 since none on her shipments).')
    assert len(alice_inc) == 0

# Try direct access to Demo shipment from Alice (Must be 403)
try:
    req_forbidden = urllib.request.Request(
        f'{BASE_URL}/incidents/{test_shipment}',
        headers={'Authorization': f'Bearer {token_alice}'}
    )
    with urllib.request.urlopen(req_forbidden) as res:
        print('ERROR: Alice was able to access demo shipment!')
        assert False
except urllib.error.HTTPError as e:
    print(f'Alice direct access blocked with HTTP {e.code}: {e.reason}')
    assert e.code == 403

print('\n=== 7. CONFIRMING SHIPMENT WITH NO INCIDENTS ===')
# Test with Alice shipment SF-206F1C
req_no_inc = urllib.request.Request(
    f'{BASE_URL}/incidents/SF-206F1C',
    headers={'Authorization': f'Bearer {token_alice}'}
)
with urllib.request.urlopen(req_no_inc) as res:
    no_inc_data = json.loads(res.read().decode())
    print(f'Shipment SF-206F1C returned {len(no_inc_data)} incidents (empty array).')
    assert len(no_inc_data) == 0

print('\n=== 8. CONFIRMING VALIDATION AND ERROR HANDLING ===')
try:
    bad_req = urllib.request.Request(
        f'{BASE_URL}/incidents',
        data=json.dumps({'shipment_id': test_shipment, 'severity': 'INVALID_CRITICAL'}).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    urllib.request.urlopen(bad_req)
    assert False
except urllib.error.HTTPError as e:
    print(f'Invalid payload correctly rejected with HTTP {e.code}')
    assert e.code == 422

print('\n=== ALL STEP 3 VERIFICATION CRITERIA PASSED! ===')
