"""
Update PRODUCTS seed pricing in server.py.

Rule: our price = official advertised (first-year) price - $5.
original_price is set to the official advertised price so the storefront
"Retail price" line is a factual comparison.

Parses the PRODUCTS literal with ast, rewrites it, and splices it back —
no fragile regex on the source. Run from the backend directory:
    python update_prices.py
"""
import ast
import pprint
from pathlib import Path

SERVER = Path(__file__).resolve().parent / "server.py"

# slug -> { variant_label: (our_price, official_price) }
NEW = {
    # ---- Norton (official first-year prices) ----
    "norton-antivirus-plus": {
        "1 PC / 1 Year": (24.99, 29.99),
        "1 PC / 2 Years": (49.99, 54.99),
    },
    "norton-360-standard": {
        "3 Devices / 1 Year": (34.99, 39.99),
        "3 Devices / 2 Years": (69.99, 74.99),
    },
    "norton-360-deluxe": {
        "3 Devices / 1 Year": (39.99, 44.99),
        "5 Devices / 1 Year": (44.99, 49.99),
        "5 Devices / 2 Years": (89.99, 94.99),
    },
    "norton-360-premium": {
        "10 Devices / 1 Year": (54.99, 59.99),
        "10 Devices / 2 Years": (109.99, 114.99),
    },
    "norton-360-with-lifelock-select": {
        "10 Devices / 1 Year": (94.99, 99.99),
    },
    "norton-360-for-gamers": {
        "3 Devices / 1 Year": (39.99, 44.99),
    },
    # ---- Webroot (current Essentials/official pricing) ----
    "webroot-antivirus": {
        "1 Device / 1 Year": (34.99, 39.99),
        "3 Devices / 1 Year": (49.99, 54.99),
    },
    "webroot-internet-security-plus": {
        "3 Devices / 1 Year": (49.99, 54.99),
        "3 Devices / 2 Years": (94.99, 99.99),
    },
    "webroot-internet-security-complete": {
        "5 Devices / 1 Year": (64.99, 69.99),
        "5 Devices / 2 Years": (124.99, 129.99),
    },
    "webroot-premium": {
        "5 Devices / 1 Year": (84.99, 89.99),
        "10 Devices / 1 Year": (114.99, 119.99),
    },
    "webroot-mobile-security": {
        "1 Device / 1 Year": (14.99, 19.99),
        "3 Devices / 1 Year": (24.99, 29.99),
    },
    "webroot-wifi-security-vpn": {
        "3 Devices / 1 Year": (39.99, 44.99),
        "5 Devices / 1 Year": (54.99, 59.99),
    },
    # ---- McAfee (official first-year prices) ----
    "mcafee-antivirus": {
        "1 PC / 1 Year": (24.99, 29.99),
        "1 PC / 2 Years": (49.99, 54.99),
    },
    "mcafee-plus-essential": {
        "5 Devices / 1 Year": (34.99, 39.99),
        "5 Devices / 2 Years": (69.99, 74.99),
    },
    "mcafee-total-protection": {
        "10 Devices / 1 Year": (44.99, 49.99),
        "10 Devices / 2 Years": (89.99, 94.99),
    },
    "mcafee-plus-premium": {
        "Unlimited Devices / 1 Year": (44.99, 49.99),
    },
    "mcafee-plus-advanced": {
        "Unlimited Devices / 1 Year": (84.99, 89.99),
    },
    "mcafee-livesafe": {
        "Unlimited Devices / 1 Year": (39.99, 44.99),
    },
}


def find_list_bounds(text, marker):
    start = text.index(marker)
    bstart = text.index("[", start)
    depth, i = 0, bstart
    in_str = None
    while i < len(text):
        c = text[i]
        if in_str:
            if c == "\\":
                i += 1
            elif c == in_str:
                in_str = None
        else:
            if c in ("'", '"'):
                in_str = c
            elif c == "[":
                depth += 1
            elif c == "]":
                depth -= 1
                if depth == 0:
                    return bstart, i + 1
        i += 1
    raise RuntimeError("Unbalanced brackets for PRODUCTS")


def main():
    text = SERVER.read_text(encoding="utf-8")
    bstart, bend = find_list_bounds(text, "PRODUCTS =")
    products = ast.literal_eval(text[bstart:bend])

    changed = 0
    for p in products:
        vm = NEW.get(p.get("slug"), {})
        for v in p.get("variants", []):
            lbl = v.get("label")
            if lbl in vm:
                price, official = vm[lbl]
                v["price"] = price
                v["original_price"] = official
                changed += 1

    new_block = pprint.pformat(products, width=110, sort_dicts=False)
    text = text[:bstart] + new_block + text[bend:]
    SERVER.write_text(text, encoding="utf-8")
    print(f"Updated {changed} variant prices across {len(products)} products")


if __name__ == "__main__":
    main()
