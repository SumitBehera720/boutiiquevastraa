import requests as r, urllib3, json, sys
urllib3.disable_warnings()
sys.stdout.reconfigure(encoding="utf-8")

base = "https://darkslategrey-chough-173926.hostingersite.com"

print("=== API Tests ===")
for method, path, data in [
    ("GET", "/api/settings", None),
    ("GET", "/api/products", None),
    ("GET", "/api/collections", None),
]:
    resp = r.request(method, base + path, json=data, timeout=15, verify=False)
    ctype = resp.headers.get("Content-Type", "")
    ok = "JSON" if "json" in ctype and resp.status_code == 200 else "FAIL"
    print(f"  [{ok}] [{resp.status_code}] {method} {path}")

print("\n=== Cart Test ===")
resp = r.post(base + "/api/cart", json={"lines": [{"merchandiseId": "gid://shopify/ProductVariant/53864981037420", "quantity": 1}]}, timeout=15, verify=False)
ok = "OK" if resp.status_code == 200 else "FAIL"
d = resp.json()
print(f"  [{ok}] [{resp.status_code}] POST /api/cart (qty={d.get('totalQuantity')}, lines={len(d.get('lines',{}).get('edges',[]))})")

print("\n=== Auth Test ===")
resp = r.get(base + "/api/auth/me", timeout=15, verify=False, headers={"Accept": "application/json"})
ok = "OK" if resp.status_code == 401 else "FAIL"
print(f"  [{ok}] [{resp.status_code}] GET /api/auth/me (no auth)")

print("\n=== Frontend POST (no CSRF) ===")
for path in ["/account/login", "/checkout", "/track-order", "/wishlist"]:
    resp = r.post(base + path, json={"test": True}, timeout=15, verify=False)
    ok = "OK" if resp.status_code != 419 else "CSRF"
    print(f"  [{ok}] [{resp.status_code}] POST {path}")

print("\n=== Frontend GET ===")
for path in ["/", "/products", "/collections", "/account/login", "/checkout", "/search", "/track-order", "/wishlist", "/admin"]:
    resp = r.get(base + path, timeout=15, verify=False, allow_redirects=False)
    status = resp.status_code
    ok = "OK" if status == 200 or (status == 307 and "admin" in path) else "FAIL"
    loc = resp.headers.get("Location", "")
    extra = f" -> {loc}" if loc else ""
    print(f"  [{ok}] [{status}] GET {path}{extra}")

print("\nAll tests complete")
