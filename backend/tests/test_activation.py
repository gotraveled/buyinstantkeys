"""Backend tests for Activation feature (iteration 4)."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/") or "https://norton-keys-shop.preview.emergentagent.com"
ADMIN_EMAIL = "admin@buyinstantkeys.com"
ADMIN_PASSWORD = "Admin@123456"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/admin/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["token"]


class TestActivationCreate:
    def test_create_activation_success(self):
        payload = {"customer_name": "TEST_Alice", "customer_email": "alice-test@example.com", "product_key": "ABCDE-FGHIJ-KLMNO-PQRST-UVWXY"}
        r = requests.post(f"{BASE_URL}/api/activations", json=payload, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["customer_name"] == "TEST_Alice"
        assert data["customer_email"] == "alice-test@example.com"
        assert data["product_key"] == "ABCDE-FGHIJ-KLMNO-PQRST-UVWXY"
        assert data["status"] == "pending"
        assert "id" in data and "created_at" in data
        pytest.activation_id = data["id"]

    def test_create_activation_empty_key(self):
        payload = {"customer_name": "TEST_Bob", "customer_email": "bob-test@example.com", "product_key": "   "}
        r = requests.post(f"{BASE_URL}/api/activations", json=payload, timeout=15)
        assert r.status_code == 400

    def test_create_activation_invalid_email(self):
        payload = {"customer_name": "TEST_Bob", "customer_email": "not-an-email", "product_key": "KEY"}
        r = requests.post(f"{BASE_URL}/api/activations", json=payload, timeout=15)
        assert r.status_code == 422


class TestAdminActivations:
    def test_admin_list_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/admin/activations", timeout=15)
        assert r.status_code == 401

    def test_admin_list_and_patch(self, admin_token):
        # Create one first
        payload = {"customer_name": "TEST_Carol", "customer_email": "carol-test@example.com", "product_key": "ZZZZZ-YYYYY-XXXXX-WWWWW-VVVVV"}
        cr = requests.post(f"{BASE_URL}/api/activations", json=payload, timeout=30)
        assert cr.status_code == 200
        new_id = cr.json()["id"]

        headers = {"Authorization": f"Bearer {admin_token}"}
        r = requests.get(f"{BASE_URL}/api/admin/activations", headers=headers, timeout=15)
        assert r.status_code == 200
        lst = r.json()
        assert isinstance(lst, list)
        ids = [x["id"] for x in lst]
        assert new_id in ids

        # PATCH
        pr = requests.patch(f"{BASE_URL}/api/admin/activations/{new_id}", json={"status": "activated"}, headers=headers, timeout=15)
        assert pr.status_code == 200
        assert pr.json()["status"] == "activated"


class TestRegression:
    def test_products_list(self):
        r = requests.get(f"{BASE_URL}/api/products", timeout=15)
        assert r.status_code == 200
        assert len(r.json()) >= 20

    def test_banner(self):
        r = requests.get(f"{BASE_URL}/api/banner", timeout=15)
        assert r.status_code == 200

    def test_admin_stats(self, admin_token):
        r = requests.get(f"{BASE_URL}/api/admin/stats", headers={"Authorization": f"Bearer {admin_token}"}, timeout=15)
        assert r.status_code == 200
