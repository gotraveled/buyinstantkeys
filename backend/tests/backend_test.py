"""Backend tests: iteration 2 – 20 products, coupons, banner, orders with coupon."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://norton-keys-shop.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@buyinstantkeys.com"
ADMIN_PASS = "Admin@123456"

EXPECTED_NEW_SLUGS = [
    "norton-antitrack",
    "norton-identity-advisor-plus",
    "norton-360-with-lifelock-select",
    "norton-360-with-lifelock-select-plus",
    "norton-360-with-lifelock-advantage",
    "norton-360-with-lifelock-ultimate-plus",
    "norton-360-deluxe-advantage",
    "norton-ultimate-help-desk",
    "norton-genie-scam-detector",
    "norton-vpn",
]
BOX_VARIANTS = {"gold", "amber", "black", "green", "purple"}


@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/admin/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ---- Products ----
class TestProducts:
    def test_products_count_20(self):
        r = requests.get(f"{API}/products")
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 20, f"expected 20, got {len(data)}"

    def test_box_variant_present(self):
        data = requests.get(f"{API}/products").json()
        for p in data:
            assert "box_variant" in p and p["box_variant"], f"{p.get('slug')} missing box_variant"
            assert p["box_variant"] in BOX_VARIANTS, f"{p['slug']} invalid variant {p['box_variant']}"

    def test_new_products_present(self):
        slugs = {p["slug"] for p in requests.get(f"{API}/products").json()}
        missing = [s for s in EXPECTED_NEW_SLUGS if s not in slugs]
        assert not missing, f"missing slugs: {missing}"

    def test_ultimate_plus_price(self):
        r = requests.get(f"{API}/products/norton-360-with-lifelock-ultimate-plus")
        assert r.status_code == 200
        p = r.json()
        # Expected $159.99 per test-req (base price)
        # Product may have variants; assert min variant or first variant matches
        prices = [v["price"] for v in p.get("variants", [])]
        assert 159.99 in prices or p.get("price") == 159.99, f"prices={prices}, base={p.get('price')}"


# ---- Coupons (public validate) ----
class TestCouponValidate:
    def test_welcome10_valid(self):
        r = requests.post(f"{API}/coupons/validate", json={"code": "WELCOME10", "subtotal": 100})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["discount_amount"] == 10.0
        assert d["new_total"] == 90.0

    def test_save20_below_min(self):
        r = requests.post(f"{API}/coupons/validate", json={"code": "SAVE20", "subtotal": 50})
        assert r.status_code == 400, r.text

    def test_invalid_code(self):
        r = requests.post(f"{API}/coupons/validate", json={"code": "INVALID_XYZ", "subtotal": 100})
        assert r.status_code == 404

    def test_case_insensitive(self):
        r = requests.post(f"{API}/coupons/validate", json={"code": "save20", "subtotal": 100})
        assert r.status_code == 200
        d = r.json()
        assert d["discount_amount"] == 20


# ---- Orders w/ coupon ----
class TestOrderCoupon:
    def _make_item(self, product=None, variant=None):
        p = product or requests.get(f"{API}/products").json()[0]
        v = variant or p["variants"][0]
        return {
            "product_id": p["id"],
            "product_name": p["name"],
            "product_slug": p.get("slug", ""),
            "variant_id": v["id"],
            "variant_label": v.get("label") or v.get("name", ""),
            "unit_price": v["price"],
            "quantity": 1,
            "subtotal": v["price"],
        }

    def test_order_with_valid_coupon(self):
        item = self._make_item()
        body = {
            "customer_name": "Test Buyer",
            "customer_email": "TEST_buyer@example.com",
            "items": [item],
            "coupon_code": "WELCOME10",
        }
        r = requests.post(f"{API}/orders", json=body)
        assert r.status_code == 200, r.text
        o = r.json()
        assert "subtotal" in o and "discount_amount" in o
        assert o["coupon_code"] == "WELCOME10"
        assert o["discount_amount"] > 0
        assert abs(o["total"] - (o["subtotal"] - o["discount_amount"])) < 0.01

    def test_order_with_invalid_coupon_still_created(self):
        item = self._make_item()
        body = {
            "customer_name": "T",
            "customer_email": "TEST_x@e.com",
            "items": [item],
            "coupon_code": "INVALID_ZZ",
        }
        r = requests.post(f"{API}/orders", json=body)
        assert r.status_code == 200, r.text
        o = r.json()
        assert o.get("coupon_code") in (None, "", "INVALID_ZZ") or o.get("discount_amount", 0) == 0
        # spec: coupon_code=null and discount=0
        assert o.get("discount_amount", 0) == 0

    def test_order_with_save20_below_min(self):
        # single low-priced item to keep subtotal below 80
        products = requests.get(f"{API}/products").json()
        # find cheapest variant
        cheapest = None
        for p in products:
            for v in p.get("variants", []):
                if cheapest is None or v["price"] < cheapest[1]["price"]:
                    cheapest = (p, v)
        p, v = cheapest
        item = {
            "product_id": p["id"],
            "product_name": p["name"],
            "product_slug": p.get("slug", ""),
            "variant_id": v["id"],
            "variant_label": v.get("label") or v.get("name", ""),
            "unit_price": v["price"],
            "quantity": 1,
            "subtotal": v["price"],
        }
        if v["price"] >= 80:
            pytest.skip("no cheap variant to test")
        body = {
            "customer_name": "T", "customer_email": "TEST_y@e.com",
            "items": [item], "coupon_code": "SAVE20",
        }
        r = requests.post(f"{API}/orders", json=body)
        assert r.status_code == 200
        o = r.json()
        assert o.get("discount_amount", 0) == 0


# ---- Banner (public) ----
class TestBanner:
    def test_banner_public(self):
        r = requests.get(f"{API}/banner")
        assert r.status_code == 200
        d = r.json()
        assert "title" in d
        assert "SAVE" in (d.get("message") or "").upper() or "SAVE" in (d.get("title") or "").upper()
        assert d.get("coupon_code") == "FLASH70"
        assert d.get("is_active") is True
        assert d.get("expires_at")


# ---- Admin coupons CRUD ----
class TestAdminCoupons:
    def test_list_coupons(self, admin_headers):
        r = requests.get(f"{API}/admin/coupons", headers=admin_headers)
        assert r.status_code == 200
        codes = {c["code"] for c in r.json()}
        for c in ("WELCOME10", "SAVE20", "FLASH70"):
            assert c in codes, f"missing {c} in {codes}"

    def test_create_update_delete_coupon(self, admin_headers):
        # cleanup pre-existing TEST10 by listing & deleting if exists
        existing = requests.get(f"{API}/admin/coupons", headers=admin_headers).json()
        for c in existing:
            if c["code"] == "TEST10":
                requests.delete(f"{API}/admin/coupons/{c['id']}", headers=admin_headers)

        # create
        r = requests.post(f"{API}/admin/coupons", headers=admin_headers,
                          json={"code": "test10", "discount_type": "percent", "discount_value": 10})
        assert r.status_code == 200, r.text
        created = r.json()
        assert created["code"] == "TEST10"
        cid = created["id"]

        # duplicate
        r2 = requests.post(f"{API}/admin/coupons", headers=admin_headers,
                           json={"code": "TEST10", "discount_type": "percent", "discount_value": 10})
        assert r2.status_code == 400

        # PATCH inactive
        r3 = requests.patch(f"{API}/admin/coupons/{cid}", headers=admin_headers,
                            json={"is_active": False})
        assert r3.status_code == 200

        # public validate inactive -> 404
        rv = requests.post(f"{API}/coupons/validate", json={"code": "TEST10", "subtotal": 100})
        assert rv.status_code == 404

        # delete
        rd = requests.delete(f"{API}/admin/coupons/{cid}", headers=admin_headers)
        assert rd.status_code in (200, 204)


# ---- Admin banner ----
class TestAdminBanner:
    def test_patch_banner(self, admin_headers):
        original = requests.get(f"{API}/banner").json()
        orig_title = original.get("title")
        try:
            r = requests.patch(f"{API}/admin/banner", headers=admin_headers, json={"title": "NEW SALE"})
            assert r.status_code == 200, r.text
            g = requests.get(f"{API}/banner").json()
            assert g["title"] == "NEW SALE"
        finally:
            # restore
            requests.patch(f"{API}/admin/banner", headers=admin_headers, json={"title": orig_title})
