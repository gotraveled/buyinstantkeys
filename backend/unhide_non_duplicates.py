"""
Inspect hidden admin products and reactivate those that are NOT duplicates
of the current seed catalog.

Set the MongoDB connection before running:
    $env:MONGO_URL="mongodb+srv://..."        # PowerShell
    python unhide_non_duplicates.py

Or use the same value that runs your FastAPI backend.
"""
import asyncio
import ast
import os
import re
from datetime import datetime, timezone
from pathlib import Path

try:
    from motor.motor_asyncio import AsyncIOMotorClient
except ImportError as e:  # pragma: no cover
    raise SystemExit("motor not installed; run: pip install motor") from e

# Same logic the backend uses to choose the DB name.
MONGO_URL = os.environ.get("MONGO_URL") or os.environ.get("MONGODB_URL")
if not MONGO_URL:
    raise SystemExit("Set MONGO_URL or MONGODB_URL environment variable.")

db_name = "buyinstantkeys"
if MONGO_URL.startswith("mongodb+srv://") or MONGO_URL.startswith("mongodb://"):
    try:
        from urllib.parse import urlparse
        parsed = urlparse(MONGO_URL)
        if parsed.path and parsed.path.strip("/"):
            db_name = parsed.path.strip("/")
    except Exception:
        pass


def normalize(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", text.lower())


def is_duplicate(hidden, seeds):
    """Match hidden admin product to a seed product by brand + normalized name."""
    hbrand = (hidden.get("brand") or "").lower()
    hname = normalize(hidden.get("name") or hidden.get("title") or "")
    hname_no_year = re.sub(r"20\d{2}", "", hname)
    for seed in seeds:
        sbrand = (seed.get("brand") or "").lower()
        sname = normalize(seed.get("name") or "")
        sname_no_year = re.sub(r"20\d{2}", "", sname)
        if hbrand == sbrand and (hname == sname or hname_no_year == sname_no_year):
            return True
    return False


async def main():
    client = AsyncIOMotorClient(MONGO_URL, serverSelectionTimeoutMS=5000)
    db = client[db_name]
    try:
        await client.admin.command("ping")
    except Exception as exc:
        raise SystemExit(f"Could not connect to MongoDB: {exc}") from exc

    # Current seed catalog from server.py (parsed safely without importing dependencies)
    import ast
    server_text = Path("server.py").read_text(encoding="utf-8")
    m = re.search(r"(?ms)^PRODUCTS = (\[.*?\])\n\n", server_text)
    if not m:
        raise SystemExit("PRODUCTS list not found in server.py")
    seeds = ast.literal_eval(m.group(1))
    seed_slugs = {p["slug"] for p in seeds}

    hidden = await db.products.find(
        {"is_active": False},
        {"_id": 0, "slug": 1, "name": 1, "brand": 1, "source": 1, "variants": 1, "title": 1},
    ).to_list(None)

    print(f"Hidden products found: {len(hidden)}\n")
    to_unhide = []
    duplicates = []
    for p in hidden:
        slug = p.get("slug", "")
        if slug in seed_slugs:
            duplicates.append((slug, "slug matches current seed catalog"))
            continue
        if is_duplicate(p, seeds):
            duplicates.append((slug, "brand/name matches a seed product"))
            continue
        to_unhide.append(p)

    if duplicates:
        print("Kept hidden (duplicates of seed catalog):")
        for slug, reason in duplicates:
            print(f"  - {slug}: {reason}")
        print()

    if not to_unhide:
        print("No non-duplicate hidden products to reactivate.")
        return

    print("Reactivating non-duplicate hidden products:")
    for p in to_unhide:
        print(f"  + {p.get('slug')} ({p.get('brand')} - {p.get('name') or p.get('title')})")
        await db.products.update_one(
            {"slug": p["slug"]},
            {
                "$set": {
                    "is_active": True,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }
            },
        )
    print(f"\nReactivated {len(to_unhide)} product(s).")


if __name__ == "__main__":
    asyncio.run(main())
