"""
Generate clean "software box" SVG images for every product/variant.

No brand logos are used — only the product name (text), a generic shield
icon, the plan/variant, device & year info, and platform line. Output goes to
frontend/public/images/products/ so the React app can serve them statically.

Run from the backend directory:
    python generate_product_images.py
"""
import ast
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SERVER = ROOT / "server.py"
OUT_DIR = ROOT.parent / "frontend" / "public" / "images" / "products"

# Brand/box accent palette (no logos, just colour + text)
PALETTE = {
    "gold":   {"band": "#F5B301", "band2": "#D89A00", "spine": "#B57F00", "chip": "#FFF4CC"},
    "amber":  {"band": "#FF9500", "band2": "#E07E00", "spine": "#B96A00", "chip": "#FFE9CC"},
    "black":  {"band": "#2B2B2B", "band2": "#1A1A1A", "spine": "#111111", "chip": "#E8E8E8"},
    "green":  {"band": "#16A34A", "band2": "#128A3E", "spine": "#0E6E31", "chip": "#D9F2E2"},
    "red":    {"band": "#DC2626", "band2": "#B91C1C", "spine": "#8F1414", "chip": "#FBDADA"},
    "purple": {"band": "#7C4DFF", "band2": "#6438E0", "spine": "#4E2BB5", "chip": "#E6DCFF"},
}


def slugify(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", s.lower().strip()).strip("-")


def load_products():
    """Extract the PRODUCTS literal from server.py without importing it."""
    tree = ast.parse(SERVER.read_text(encoding="utf-8"))
    for node in tree.body:
        if isinstance(node, ast.Assign):
            for t in node.targets:
                if isinstance(t, ast.Name) and t.id == "PRODUCTS":
                    return ast.literal_eval(node.value)
    raise RuntimeError("PRODUCTS list not found in server.py")


def wrap(text: str, width: int = 20):
    words = text.split()
    lines, cur = [], ""
    for w in words:
        if len(cur) + len(w) + 1 <= width:
            cur = (cur + " " + w).strip()
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines[:3]


def esc(s: str) -> str:
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
             .replace('"', "&quot;"))


def variant_spec(v):
    devices = v.get("devices", 1)
    years = v.get("years", 1)
    dev = "Unlimited Devices" if devices >= 999 else f"{devices} Device{'s' if devices != 1 else ''}"
    yr = f"{years} Year{'s' if years != 1 else ''}"
    return dev, yr


def box_svg(product, variant):
    cfg = PALETTE.get(product.get("box_variant", "gold"), PALETTE["gold"])
    name = product.get("name", "Product")
    category = product.get("category", "Security")
    brand = product.get("brand", "")
    dev, yr = variant_spec(variant)
    vlabel = variant.get("label", f"{dev} / {yr}")

    name_lines = wrap(name, 20)
    # vertical layout for the name block
    name_svg = ""
    y = 300
    for ln in name_lines:
        name_svg += f'<text x="300" y="{y}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="40" font-weight="800" fill="#111827">{esc(ln)}</text>\n'
        y += 46

    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="600" height="760" viewBox="0 0 600 760">
  <defs>
    <linearGradient id="face" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFFFFF"/>
      <stop offset="1" stop-color="#EEF2F6"/>
    </linearGradient>
    <linearGradient id="band" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="{cfg['band']}"/>
      <stop offset="1" stop-color="{cfg['band2']}"/>
    </linearGradient>
    <linearGradient id="gloss" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.55"/>
      <stop offset="0.5" stop-color="#FFFFFF" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <!-- drop shadow -->
  <rect x="58" y="46" width="500" height="700" rx="20" fill="#0F172A" opacity="0.14"/>
  <!-- spine -->
  <rect x="40" y="30" width="86" height="700" rx="20" fill="{cfg['spine']}"/>
  <!-- front face -->
  <rect x="78" y="30" width="482" height="700" rx="20" fill="url(#face)" stroke="#D4DAE3"/>
  <!-- gloss sweep -->
  <rect x="78" y="30" width="200" height="700" rx="20" fill="url(#gloss)"/>

  <!-- top colour band -->
  <path d="M78 50 Q78 30 98 30 L540 30 Q560 30 560 50 L560 150 L78 150 Z" fill="url(#band)"/>
  <text x="300" y="86" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="26" font-weight="800" letter-spacing="3" fill="#FFFFFF">{esc(brand.upper())}</text>
  <text x="300" y="122" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="600" letter-spacing="1" fill="#FFFFFF" opacity="0.92">{esc(category)}</text>

  <!-- generic shield icon (no brand logo) -->
  <g transform="translate(300 205)">
    <path d="M0 -34 C18 -26 34 -22 34 -22 L34 6 C34 30 18 44 0 52 C-18 44 -34 30 -34 6 L-34 -22 C-34 -22 -18 -26 0 -34 Z" fill="{cfg['band']}" opacity="0.16"/>
    <path d="M0 -28 C15 -21 28 -18 28 -18 L28 5 C28 25 15 37 0 44 C-15 37 -28 25 -28 5 L-28 -18 C-28 -18 -15 -21 0 -28 Z" fill="{cfg['band']}"/>
    <path d="M-11 4 L-3 12 L13 -8" stroke="#FFFFFF" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>

  <!-- product name -->
  {name_svg}
  <!-- variant chip -->
  <rect x="150" y="{y - 8}" width="300" height="52" rx="26" fill="{cfg['chip']}" stroke="{cfg['band']}" stroke-opacity="0.4"/>
  <text x="300" y="{y + 25}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="700" fill="#1F2937">{esc(dev)} · {esc(yr)}</text>

  <!-- plan label -->
  <text x="300" y="{y + 78}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="19" font-weight="600" fill="#6B7280">{esc(vlabel)}</text>

  <!-- divider -->
  <rect x="150" y="{y + 108}" width="300" height="2" fill="#E5E7EB"/>

  <!-- platform line -->
  <text x="300" y="{y + 150}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="600" fill="#374151">Windows · macOS · Android · iOS</text>
  <text x="300" y="{y + 184}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="17" fill="#9CA3AF">Digital download · Delivered by email</text>

  <!-- bottom strip -->
  <rect x="78" y="672" width="482" height="58" rx="0" fill="{cfg['band']}" opacity="0.10"/>
  <text x="300" y="708" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="700" letter-spacing="2" fill="{cfg['band2']}">GENUINE LICENSE KEY</text>
</svg>
'''


def main():
    products = load_products()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    count = 0
    for p in products:
        slug = p.get("slug") or slugify(p.get("name", "product"))
        variants = p.get("variants") or [{}]
        for i, v in enumerate(variants):
            label = v.get("label", f"plan-{i}")
            fname = f"{slug}--{slugify(label)}.svg"
            (OUT_DIR / fname).write_text(box_svg(p, v), encoding="utf-8")
            count += 1
            if i == 0:
                # default per-product image = first variant
                (OUT_DIR / f"{slug}.svg").write_text(box_svg(p, v), encoding="utf-8")
                count += 1
    print(f"Wrote {count} SVG images to {OUT_DIR}")


if __name__ == "__main__":
    main()
