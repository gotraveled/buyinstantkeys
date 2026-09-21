"""Apply remaining server.py changes reliably (edit tool wasn't persisting)."""
from pathlib import Path

p = Path(__file__).resolve().parent / "server.py"
s = p.read_text(encoding="utf-8")
orig = s

# 1) ProductCreate: image_url default + box_variant + is_active
old_pc = '''    brand: str = "Norton"
    image_url: str
    badge: Optional[str] = None
    features: List[str] = []
    variants: List[Variant] = []
    is_featured: bool = False

class ProductUpdate(BaseModel):'''
new_pc = '''    brand: str = "Norton"
    image_url: str = ""
    box_variant: str = "gold"
    badge: Optional[str] = None
    features: List[str] = []
    variants: List[Variant] = []
    is_featured: bool = False
    is_active: bool = True

class ProductUpdate(BaseModel):'''
if old_pc in s:
    s = s.replace(old_pc, new_pc)
    print("ProductCreate updated")
else:
    print("ProductCreate pattern not found (maybe already updated)")

# 2) ProductUpdate: add box_variant after image_url
old_pu = '''    brand: Optional[str] = None
    image_url: Optional[str] = None
    badge: Optional[str] = None'''
new_pu = '''    brand: Optional[str] = None
    image_url: Optional[str] = None
    box_variant: Optional[str] = None
    badge: Optional[str] = None'''
if new_pu not in s:
    if old_pu in s:
        s = s.replace(old_pu, new_pu, 1)
        print("ProductUpdate updated")
    else:
        print("ProductUpdate pattern not found")
else:
    print("ProductUpdate already updated")

# 3) SEED_VERSION bump
s = s.replace('SEED_VERSION = "2026-09-v6-3brand"', 'SEED_VERSION = "2026-09-v7-official-pricing"')

# 4) Reseed -> upsert-by-slug preserving ids
old_seed = '''        await db.products.delete_many({})
        for p in PRODUCTS:
            variants = [Variant(**v).model_dump() for v in p["variants"]]
            product = Product(**{**p, "variants": variants})
            await db.products.insert_one(product.model_dump())'''
new_seed = '''        # Upsert by slug: refresh seed products (incl. prices) without wiping
        # admin-added products or changing product/variant IDs.
        for p in PRODUCTS:
            variants = [Variant(**v).model_dump() for v in p["variants"]]
            product = Product(**{**p, "variants": variants}).model_dump()
            existing = await db.products.find_one({"slug": product["slug"]})
            if existing:
                product["id"] = existing["id"]
                product["created_at"] = existing.get("created_at", product["created_at"])
                existing_variant_ids = {v.get("label"): v.get("id") for v in existing.get("variants", [])}
                for v in product["variants"]:
                    if v.get("label") in existing_variant_ids:
                        v["id"] = existing_variant_ids[v["label"]]
                await db.products.update_one({"slug": product["slug"]}, {"$set": product})
            else:
                await db.products.insert_one(product)'''
if old_seed in s:
    s = s.replace(old_seed, new_seed)
    print("seed_data updated")
else:
    print("seed_data pattern not found (maybe already updated)")

# 5) Merchant feed description -> clean
import re
s = re.sub(
    r'SubElement\(channel, "description"\)\.text = f"[^"]*"',
    'SubElement(channel, "description").text = f"Genuine antivirus license keys with fast email delivery from {STORE_NAME}."',
    s,
)

p.write_text(s, encoding="utf-8")
print("changed" if s != orig else "no change")
