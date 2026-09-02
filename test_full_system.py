import urllib.request
import urllib.error
import json

def verify():
    print("================ SMART FREIGHT SYSTEM VERIFICATION ================")
    
    # 1. Backend Health Check
    try:
        req = urllib.request.Request("http://127.0.0.1:8000/health")
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            print(f"[OK] Backend API Health: {data}")
    except Exception as e:
        print(f"[FAIL] Backend API Health failed: {e}")

    # 2. Frontend Pages Check
    pages = ["/", "/vehicles", "/shipments", "/routes", "/risks", "/fleet", "/driver", "/costs"]
    for p in pages:
        try:
            req = urllib.request.Request(f"http://127.0.0.1:3000{p}")
            with urllib.request.urlopen(req) as resp:
                print(f"[OK] Frontend Page '{p}' -> Status {resp.status}")
        except Exception as e:
            print(f"[FAIL] Frontend Page '{p}' -> Error: {e}")

    print("====================================================================")

if __name__ == "__main__":
    verify()
