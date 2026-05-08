"""Quick API test script"""
import urllib.request
import json

BASE = "http://127.0.0.1:5000"

def test(method, path):
    url = f"{BASE}{path}"
    print(f"\n{'='*60}")
    print(f"{method} {url}")
    print('='*60)
    try:
        req = urllib.request.Request(url, method=method, data=b"" if method == "POST" else None)
        req.add_header("Content-Type", "application/json")
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read())
            print(json.dumps(data, indent=2, default=str)[:3000])
    except Exception as e:
        print(f"ERROR: {e}")
        if hasattr(e, 'read'):
            print(e.read().decode())

test("GET", "/api/health")
test("POST", "/api/run-workflow")
test("GET", "/api/reports")
