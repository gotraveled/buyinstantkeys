"""Iteration 3 backend tests: order phone+address, PayPal LIVE config."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://norton-keys-shop.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


def _make_item():
    products = requests.get(f"{API}/products").json()
    p = products[0]
    v = p["variants"][0]
    return p, {
        "product_id": p["id"],
        "product_name": p["name"],
        "variant_id": v["id"],
        "variant_label": v["label"],
        "unit_price": v["price"],
        "quantity": 1,
        "subtotal": v["price"],
    }


class TestOrderCustomerFields:
    def test_order_with_phone_address(self):
        _, item = _make_item()
        body = {
            "customer_name": "Test Buyer",
            "customer_email": "TEST_i3phone@example.com",
            "customer_phone": "+1-555-123-4567",
            "customer_address": "742 Evergreen Terrace, Springfield, IL 62704",
            "items": [item],
        }
        r = requests.post(f"{API}/orders", json=body)
        assert r.status_code == 200, r.text
        o = r.json()
        assert o["customer_phone"] == "+1-555-123-4567"
        assert o["customer_address"].startswith("742 Evergreen")
        # GET roundtrip
        g = requests.get(f"{API}/orders/{o['id']}")
        assert g.status_code == 200
        gd = g.json()
        assert gd["customer_phone"] == body["customer_phone"]
        assert gd["customer_address"] == body["customer_address"]

    def test_order_without_phone_address(self):
        _, item = _make_item()
        body = {
            "customer_name": "Test Buyer",
            "customer_email": "TEST_i3nophone@example.com",
            "items": [item],
        }
        r = requests.post(f"{API}/orders", json=body)
        assert r.status_code == 200, r.text
        o = r.json()
        assert o.get("customer_phone") in (None, "")
        assert o.get("customer_address") in (None, "")


class TestPayPalLive:
    def test_config_live(self):
        r = requests.get(f"{API}/config")
        assert r.status_code == 200
        d = r.json()
        assert d["paypal_enabled"] is True, f"Expected paypal enabled, got {d}"
        assert d["paypal_mode"] == "live", f"Expected mode 'live', got {d.get('paypal_mode')}"
        assert d.get("paypal_client_id"), "paypal_client_id should be exposed when enabled"

    def test_paypal_order_create(self):
        _, item = _make_item()
        body = {
            "customer_name": "PP Test",
            "customer_email": "TEST_i3paypal@example.com",
            "customer_phone": "555",
            "customer_address": "addr",
            "items": [item],
        }
        r = requests.post(f"{API}/orders", json=body)
        assert r.status_code == 200
        oid = r.json()["id"]
        # DO NOT capture. Just create paypal order.
        pr = requests.post(f"{API}/orders/{oid}/paypal/create")
        assert pr.status_code == 200, pr.text
        pdata = pr.json()
        ppid = pdata.get("paypal_order_id")
        assert ppid and isinstance(ppid, str)
        assert 15 <= len(ppid) <= 22, f"PayPal order id length unexpected: {ppid}"
