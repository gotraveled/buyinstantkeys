from pathlib import Path

p = Path(__file__).resolve().parent / "server.py"
lines = p.read_text(encoding="utf-8").splitlines(keepends=True)

out = []
i = 0
while i < len(lines):
    line = lines[i]
    # Drop the FLASH70 coupon line inside DEFAULT_COUPONS
    if '"code": "FLASH70"' in line:
        i += 1
        continue
    # Rewrite the whole DEFAULT_BANNER dict
    if line.startswith("DEFAULT_BANNER"):
        out.append('DEFAULT_BANNER = {\n')
        out.append('    "id": "site-banner",\n')
        out.append('    "title": "Genuine license keys",\n')
        out.append('    "message": "Genuine antivirus license keys delivered by email - secure checkout and a 30-day money-back guarantee",\n')
        out.append('    "coupon_code": "",\n')
        out.append('    "expires_at": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(),\n')
        out.append('    "is_active": False,\n')
        out.append('}\n')
        # skip until the closing brace of the old dict
        i += 1
        while i < len(lines) and lines[i].strip() != "}":
            i += 1
        i += 1  # skip the closing brace line
        continue
    out.append(line)
    i += 1

p.write_text("".join(out), encoding="utf-8")
print("done")
