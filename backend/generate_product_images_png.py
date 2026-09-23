"""
Generate PNG product box images for Google Merchant Center compatibility.
Output: frontend/public/images/products/{slug}.png
"""
import ast
import re
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
SERVER = ROOT / "server.py"
OUT_DIR = ROOT.parent / "frontend" / "public" / "images" / "products"
OUT_DIR.mkdir(parents=True, exist_ok=True)

PALETTE = {
    "gold":   {"band": (245, 179, 1),   "bg": (255, 248, 225), "text": (51, 31, 0)},
    "amber":  {"band": (255, 149, 0),   "bg": (255, 243, 224), "text": (51, 31, 0)},
    "black":  {"band": (43, 43, 43),    "bg": (240, 240, 240), "text": (255, 255, 255)},
    "green":  {"band": (22, 163, 74),   "bg": (220, 242, 229), "text": (255, 255, 255)},
    "red":    {"band": (220, 38, 38),   "bg": (254, 226, 226), "text": (255, 255, 255)},
    "purple": {"band": (124, 77, 255),  "bg": (230, 221, 255), "text": (255, 255, 255)},
}


def load_products():
    tree = ast.parse(SERVER.read_text(encoding="utf-8"))
    for node in tree.body:
        if isinstance(node, ast.Assign):
            for t in node.targets:
                if isinstance(t, ast.Name) and t.id == "PRODUCTS":
                    return ast.literal_eval(node.value)
    raise RuntimeError("PRODUCTS list not found in server.py")


def get_font(size):
    candidates = [
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/segoeui.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            pass
    return ImageFont.load_default()


def draw_centered_text(draw, text, box, font, fill):
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = box[0] + (box[2] - box[0] - tw) / 2
    y = box[1] + (box[3] - box[1] - th) / 2
    draw.text((x, y), text, font=font, fill=fill)


def generate_png(product):
    cfg = PALETTE.get(product.get("box_variant", "gold"), PALETTE["gold"])
    W, H = 600, 800
    img = Image.new("RGB", (W, H), (255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Background subtle shadow/border
    draw.rectangle([(40, 40), (W - 40, H - 40)], fill=(250, 250, 250), outline=(220, 220, 220), width=2)

    # Brand band
    band_h = 120
    draw.rectangle([(45, 45), (W - 45, 45 + band_h)], fill=cfg["band"])

    # Brand name
    brand_font = get_font(34)
    draw_centered_text(draw, product.get("brand", "").upper(), (45, 50, W - 45, 50 + band_h), brand_font, cfg["text"])

    # Product name
    name = product.get("name", "")
    name_font = get_font(42)
    words = name.split()
    lines, cur = [], ""
    for w in words:
        if draw.textlength((cur + " " + w).strip(), font=name_font) < W - 110:
            cur = (cur + " " + w).strip()
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    lines = lines[:3]
    y = 220
    for line in lines:
        draw_centered_text(draw, line, (45, y, W - 45, y + 60), name_font, (33, 33, 33))
        y += 58

    # Category / tagline
    tagline = product.get("tagline", "")
    tag_font = get_font(22)
    draw_centered_text(draw, tagline[:60], (45, 380, W - 45, 430), tag_font, (80, 80, 80))

    # Variant box
    variants = product.get("variants", [])
    if variants:
        v = variants[0]
        label = v.get("label", "")
        price = f"${float(v.get('price', 0)):.2f}"
        box_font = get_font(28)
        price_font = get_font(48)
        draw.rectangle([(80, 480), (W - 80, 580)], fill=cfg["bg"], outline=cfg["band"], width=3)
        draw_centered_text(draw, label, (80, 490, W - 80, 545), box_font, cfg["text"])
        draw_centered_text(draw, price, (80, 545, W - 80, 590), price_font, cfg["band"])

    # Security badge text
    badge_font = get_font(20)
    draw_centered_text(draw, "Genuine License Key · Instant Email Delivery", (45, 680, W - 45, 720), badge_font, (100, 100, 100))

    slug = product.get("slug", "")
    img.save(OUT_DIR / f"{slug}.png", "PNG")


def main():
    products = load_products()
    for p in products:
        generate_png(p)
    print(f"Wrote {len(products)} PNG images to {OUT_DIR}")


if __name__ == "__main__":
    main()
