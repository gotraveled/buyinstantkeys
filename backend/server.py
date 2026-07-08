from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import asyncio
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt as pyjwt
import resend
import httpx

ROOT_DIR = Path(__file__).parent
FRONTEND_BUILD = ROOT_DIR.parent / "frontend" / "build"
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ.get('JWT_SECRET', 'change_me')
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@buyinstantkeys.com')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'Admin@123456')
STORE_NOTIFICATION_EMAIL = os.environ.get('STORE_NOTIFICATION_EMAIL', 'orders@buyinstantkeys.com')
PAYPAL_MODE = os.environ.get('PAYPAL_MODE', 'sandbox')
PAYPAL_CLIENT_ID = os.environ.get('PAYPAL_CLIENT_ID', '')
PAYPAL_CLIENT_SECRET = os.environ.get('PAYPAL_CLIENT_SECRET', '')
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
STORE_NAME = os.environ.get('STORE_NAME', 'BuyInstantKeys')
STORE_URL = os.environ.get('STORE_URL', 'https://buyinstantkeys.com')

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

PAYPAL_BASE = "https://api-m.sandbox.paypal.com" if PAYPAL_MODE == 'sandbox' else "https://api-m.paypal.com"
PAYPAL_ENABLED = bool(PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET)

app = FastAPI(title="BuyInstantKeys API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============ MODELS ============
def now_iso():
    return datetime.now(timezone.utc).isoformat()

class Variant(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    devices: int
    years: int
    label: str
    price: float
    original_price: Optional[float] = None

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    slug: str
    name: str
    tagline: str
    description: str
    category: str
    image_url: str = ""
    box_variant: str = "gold"  # gold | amber | black | green | purple
    badge: Optional[str] = None
    features: List[str] = []
    variants: List[Variant] = []
    is_featured: bool = False
    is_active: bool = True
    created_at: str = Field(default_factory=now_iso)

class ProductCreate(BaseModel):
    slug: str
    name: str
    tagline: str
    description: str
    category: str
    image_url: str
    badge: Optional[str] = None
    features: List[str] = []
    variants: List[Variant] = []
    is_featured: bool = False

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    tagline: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    badge: Optional[str] = None
    features: Optional[List[str]] = None
    variants: Optional[List[Variant]] = None
    is_featured: Optional[bool] = None
    is_active: Optional[bool] = None

class OrderItem(BaseModel):
    product_id: str
    product_name: str
    variant_id: str
    variant_label: str
    unit_price: float
    quantity: int
    subtotal: float
    license_key: Optional[str] = None

class OrderCreate(BaseModel):
    customer_name: str
    customer_email: EmailStr
    customer_phone: Optional[str] = None
    customer_address: Optional[str] = None
    items: List[OrderItem]
    coupon_code: Optional[str] = None

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_number: str
    customer_name: str
    customer_email: str
    customer_phone: Optional[str] = None
    customer_address: Optional[str] = None
    items: List[OrderItem]
    subtotal: float = 0
    discount_amount: float = 0
    coupon_code: Optional[str] = None
    total: float
    status: str = "pending"  # pending, paid, delivered, cancelled, refunded
    payment_method: Optional[str] = None
    paypal_order_id: Optional[str] = None
    paid_at: Optional[str] = None
    delivered_at: Optional[str] = None
    admin_notes: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)

class DeliverKeysBody(BaseModel):
    keys: List[dict]  # [{variant_id, license_key}] mapped per item index
    admin_note: Optional[str] = None

class AdminLogin(BaseModel):
    email: EmailStr
    password: str

class OrderTrackQuery(BaseModel):
    email: EmailStr
    order_number: str

# ============ AUTH ============
def create_token(email: str) -> str:
    payload = {
        "sub": email,
        "role": "admin",
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm="HS256")

def verify_admin(authorization: Optional[str] = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = authorization.split(" ", 1)[1]
    try:
        payload = pyjwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        if payload.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Forbidden")
        return payload["sub"]
    except pyjwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============ SEED DATA ============
SEED_VERSION = "2026-02-v3"

NORTON_PRODUCTS = [
    {
        "slug": "norton-antivirus-plus",
        "name": "Norton AntiVirus Plus",
        "tagline": "Essential virus and malware protection for 1 PC",
        "description": "Powerful protection against viruses, malware, ransomware and hacking, with password manager, smart firewall and cloud backup.",
        "category": "AntiVirus",
        "box_variant": "gold",
        "image_url": "",
        "features": ["Real-time threat protection", "Smart Firewall", "Password Manager", "2GB Cloud Backup", "Genie AI Assistant"],
        "variants": [
            {"devices": 1, "years": 1, "label": "1 PC / 1 Year", "price": 34.99, "original_price": 59.99},
            {"devices": 1, "years": 2, "label": "1 PC / 2 Years", "price": 54.99, "original_price": 119.99},
        ],
    },
    {
        "slug": "norton-360-standard",
        "name": "Norton 360 Standard",
        "tagline": "Complete protection for up to 3 devices",
        "description": "Real-time protection against viruses, ransomware and other online threats. Includes VPN, Password Manager, Dark Web Monitoring and Privacy Monitor.",
        "category": "Norton 360",
        "box_variant": "gold",
        "image_url": "",
        "features": ["Real-time threat protection", "Secure VPN", "Password Manager", "10GB Cloud Backup", "Dark Web Monitoring", "SafeCam for PC"],
        "variants": [
            {"devices": 3, "years": 1, "label": "3 Devices / 1 Year", "price": 39.99, "original_price": 79.99},
            {"devices": 3, "years": 2, "label": "3 Devices / 2 Years", "price": 74.99, "original_price": 159.99},
        ],
        "is_featured": True,
    },
    {
        "slug": "norton-360-deluxe",
        "name": "Norton 360 Deluxe",
        "tagline": "Award-winning protection for up to 5 devices",
        "description": "Multi-layered security with VPN, password manager, dark web monitoring, 50GB PC cloud backup and parental controls. Trusted by millions worldwide.",
        "category": "Norton 360",
        "box_variant": "gold",
        "image_url": "",
        "badge": "Best Seller",
        "features": ["Real-time threat protection", "Secure VPN", "Password Manager", "50GB Cloud Backup", "Parental Controls", "SafeCam for PC", "Privacy Monitor Assistant"],
        "variants": [
            {"devices": 3, "years": 1, "label": "3 Devices / 1 Year", "price": 49.99, "original_price": 109.99},
            {"devices": 5, "years": 1, "label": "5 Devices / 1 Year", "price": 59.99, "original_price": 124.99},
            {"devices": 5, "years": 2, "label": "5 Devices / 2 Years", "price": 99.99, "original_price": 229.99},
        ],
        "is_featured": True,
    },
    {
        "slug": "norton-360-deluxe-advantage",
        "name": "Norton 360 Deluxe Advantage",
        "tagline": "Deluxe protection with identity advisor",
        "description": "Everything in Norton 360 Deluxe plus Norton Identity Advisor Plus — providing identity monitoring, restoration assistance and stolen wallet protection.",
        "category": "Norton 360",
        "box_variant": "amber",
        "image_url": "",
        "features": ["All Norton 360 Deluxe features", "Identity Advisor Plus", "Restoration specialist", "Stolen wallet protection", "Dark Web Monitoring"],
        "variants": [
            {"devices": 5, "years": 1, "label": "5 Devices / 1 Year", "price": 79.99, "original_price": 149.99},
        ],
    },
    {
        "slug": "norton-360-with-lifelock-select",
        "name": "Norton 360 with LifeLock Select",
        "tagline": "Device security + identity theft protection",
        "description": "Combines Norton 360 device security with LifeLock identity theft protection. Includes Credit Monitoring (1 bureau) and up to $25K reimbursement for stolen funds.",
        "category": "LifeLock",
        "box_variant": "black",
        "image_url": "",
        "badge": "Popular",
        "features": ["Everything in Norton 360 Deluxe", "LifeLock Identity Alert System", "Credit Monitoring (1 bureau)", "$25K stolen funds reimbursement", "Million Dollar Protection Package"],
        "variants": [
            {"devices": 5, "years": 1, "label": "5 Devices / 1 Year", "price": 89.99, "original_price": 189.99},
            {"devices": 10, "years": 1, "label": "10 Devices / 1 Year", "price": 109.99, "original_price": 229.99},
        ],
        "is_featured": True,
    },
    {
        "slug": "norton-360-with-lifelock-select-plus",
        "name": "Norton 360 with LifeLock Select Plus",
        "tagline": "Enhanced identity protection with credit reporting",
        "description": "Upgrade to enhanced identity monitoring, annual credit report, credit lock and higher reimbursement limits.",
        "category": "LifeLock",
        "box_variant": "black",
        "image_url": "",
        "features": ["All Select features", "Annual credit report + score", "Credit lock (1 bureau)", "$50K stolen funds reimbursement", "Enhanced Dark Web Monitoring"],
        "variants": [
            {"devices": 10, "years": 1, "label": "10 Devices / 1 Year", "price": 109.99, "original_price": 249.99},
        ],
    },
    {
        "slug": "norton-360-with-lifelock-advantage",
        "name": "Norton 360 with LifeLock Advantage",
        "tagline": "Advanced identity protection with credit alerts",
        "description": "Everything in Select plus enhanced credit monitoring, bank & credit card activity alerts, and up to $100K reimbursement for stolen funds.",
        "category": "LifeLock",
        "box_variant": "black",
        "image_url": "",
        "features": ["All Select Plus features", "Bank & credit card activity alerts", "Credit Monitoring (1 bureau)", "$100K stolen funds reimbursement", "Court records scanning"],
        "variants": [
            {"devices": 10, "years": 1, "label": "10 Devices / 1 Year", "price": 119.99, "original_price": 279.99},
        ],
        "is_featured": True,
    },
    {
        "slug": "norton-360-with-lifelock-ultimate-plus",
        "name": "Norton 360 with LifeLock Ultimate Plus",
        "tagline": "Top-tier protection with 3-bureau monitoring",
        "description": "Our most comprehensive plan: unlimited device coverage, 3-bureau credit monitoring, $1M reimbursement for stolen funds and 500GB cloud backup.",
        "category": "LifeLock",
        "box_variant": "black",
        "image_url": "",
        "badge": "Ultimate",
        "features": ["Unlimited devices", "3-bureau credit monitoring", "$1M stolen funds reimbursement", "500GB Cloud Backup", "24/7 live assistance"],
        "variants": [
            {"devices": 999, "years": 1, "label": "Unlimited Devices / 1 Year", "price": 159.99, "original_price": 349.99},
        ],
        "is_featured": True,
    },
    {
        "slug": "norton-360-for-gamers",
        "name": "Norton 360 for Gamers",
        "tagline": "Multi-layered protection for PC gamers",
        "description": "Game-optimized security with Game Optimizer, notification blocker and Secure VPN — no interruptions to your gameplay.",
        "category": "Gaming",
        "box_variant": "purple",
        "image_url": "",
        "badge": "Gamer's Choice",
        "features": ["Game Optimizer", "Notification blocker", "Secure VPN", "Dark Web Monitoring", "Webcam protection"],
        "variants": [
            {"devices": 3, "years": 1, "label": "3 Devices / 1 Year", "price": 49.99, "original_price": 99.99},
        ],
    },
    {
        "slug": "norton-vpn",
        "name": "Norton VPN",
        "tagline": "Private, encrypted browsing anywhere",
        "description": "Bank-grade encryption to keep your online activity private on public Wi-Fi and unsecured networks. Access global content without borders.",
        "category": "Privacy",
        "box_variant": "green",
        "image_url": "",
        "features": ["Bank-grade encryption", "No-log VPN", "Ad tracker blocking", "Wi-Fi security", "Kill switch"],
        "variants": [
            {"devices": 1, "years": 1, "label": "1 Device / 1 Year", "price": 29.99, "original_price": 49.99},
            {"devices": 5, "years": 1, "label": "5 Devices / 1 Year", "price": 39.99, "original_price": 69.99},
            {"devices": 10, "years": 1, "label": "10 Devices / 1 Year", "price": 49.99, "original_price": 89.99},
        ],
    },
    {
        "slug": "norton-antitrack",
        "name": "Norton AntiTrack",
        "tagline": "Stop trackers from following you online",
        "description": "Prevents data collection companies from tracking your online activity, browser fingerprinting and behavior profiling.",
        "category": "Privacy",
        "box_variant": "green",
        "image_url": "",
        "features": ["Anti-fingerprinting", "Anonymizes searches", "Cookie blocking", "Privacy dashboard", "Ad tracker prevention"],
        "variants": [
            {"devices": 1, "years": 1, "label": "1 Device / 1 Year", "price": 39.99, "original_price": 59.99},
            {"devices": 3, "years": 1, "label": "3 Devices / 1 Year", "price": 49.99, "original_price": 89.99},
        ],
    },
    {
        "slug": "norton-identity-advisor-plus",
        "name": "Norton Identity Advisor Plus",
        "tagline": "Identity monitoring with restoration assistance",
        "description": "24/7 identity monitoring with Dark Web scanning, restoration specialists on standby and stolen wallet assistance.",
        "category": "Identity",
        "box_variant": "amber",
        "image_url": "",
        "features": ["Identity theft monitoring", "Dark Web scanning", "Restoration specialist", "Stolen wallet protection", "Social media monitoring"],
        "variants": [
            {"devices": 1, "years": 1, "label": "1 Adult / 1 Year", "price": 99.99, "original_price": 189.99},
        ],
    },
    {
        "slug": "norton-utilities-ultimate",
        "name": "Norton Utilities Ultimate",
        "tagline": "Speed up and clean your PC",
        "description": "Powerful tools to optimize PC performance, clean up junk files, fix registry issues and extend your device's life.",
        "category": "Utilities",
        "box_variant": "gold",
        "image_url": "",
        "features": ["PC cleaner", "Speed optimizer", "Privacy cleaner", "Disk defragmenter", "App uninstaller"],
        "variants": [
            {"devices": 10, "years": 1, "label": "10 PCs / 1 Year", "price": 39.99, "original_price": 79.99},
        ],
    },
    {
        "slug": "norton-family",
        "name": "Norton Family",
        "tagline": "Parental controls for kids online",
        "description": "Keep your kids safer online with screen time limits, content filtering, location supervision and school time features.",
        "category": "Family",
        "box_variant": "amber",
        "image_url": "",
        "features": ["Web supervision", "Screen time management", "Location tracking", "School time", "Video supervision"],
        "variants": [
            {"devices": 999, "years": 1, "label": "Unlimited Devices / 1 Year", "price": 44.99, "original_price": 79.99},
        ],
    },
    {
        "slug": "norton-small-business",
        "name": "Norton Small Business",
        "tagline": "Protection built for small businesses",
        "description": "Easy-to-deploy protection for PCs, Macs, iOS and Android devices in your small business. Cloud console for centralized management.",
        "category": "Business",
        "box_variant": "black",
        "image_url": "",
        "features": ["Multi-device deployment", "Cloud console", "24/7 customer service", "Reputation-based protection"],
        "variants": [
            {"devices": 5, "years": 1, "label": "5 Devices / 1 Year", "price": 69.99, "original_price": 129.99},
            {"devices": 10, "years": 1, "label": "10 Devices / 1 Year", "price": 109.99, "original_price": 179.99},
            {"devices": 20, "years": 1, "label": "20 Devices / 1 Year", "price": 169.99, "original_price": 279.99},
        ],
    },
    {
        "slug": "norton-mobile-security",
        "name": "Norton Mobile Security",
        "tagline": "Powerful protection for iOS & Android",
        "description": "Safeguard your smartphone from cyber threats, malicious apps, phishing links, unsafe Wi-Fi and web attacks.",
        "category": "Mobile",
        "box_variant": "green",
        "image_url": "",
        "features": ["App advisor", "Wi-Fi security", "Web protection", "SMS filtering", "Anti-theft"],
        "variants": [
            {"devices": 1, "years": 1, "label": "1 Device / 1 Year", "price": 29.99, "original_price": 49.99},
        ],
    },
    {
        "slug": "norton-password-manager",
        "name": "Norton Password Manager",
        "tagline": "Secure, generate and remember passwords",
        "description": "Store, generate, and autofill strong passwords in a secure encrypted vault across all your devices.",
        "category": "Privacy",
        "box_variant": "green",
        "image_url": "",
        "features": ["Encrypted vault", "Password generator", "Auto-fill", "Cross-device sync", "Security dashboard"],
        "variants": [
            {"devices": 999, "years": 1, "label": "Unlimited Devices / 1 Year", "price": 24.99, "original_price": 39.99},
        ],
    },
    {
        "slug": "norton-ultimate-help-desk",
        "name": "Norton Ultimate Help Desk",
        "tagline": "24/7 expert assistance for any device",
        "description": "Expert assistance for setup, troubleshooting, malware removal and optimization — anytime, any device.",
        "category": "Services",
        "box_variant": "amber",
        "image_url": "",
        "features": ["24/7 online assistance", "Setup assistance", "Malware removal", "Data recovery assistance", "Software installation"],
        "variants": [
            {"devices": 999, "years": 1, "label": "Unlimited Assistance / 1 Year", "price": 119.99, "original_price": 199.99},
        ],
    },
    {
        "slug": "norton-genie-scam-detector",
        "name": "Norton Genie Scam Detector",
        "tagline": "AI-powered scam detection",
        "description": "Norton's AI-powered scam detection tool that analyzes messages, emails and URLs to warn you before you fall for a scam.",
        "category": "AntiVirus",
        "box_variant": "purple",
        "image_url": "",
        "badge": "AI-Powered",
        "features": ["AI scam analysis", "Message & email scanning", "URL safety check", "Real-time alerts"],
        "variants": [
            {"devices": 5, "years": 1, "label": "5 Devices / 1 Year", "price": 39.99, "original_price": 69.99},
        ],
    },
    {
        "slug": "norton-360-premium",
        "name": "Norton 360 Premium",
        "tagline": "Advanced protection for up to 10 devices",
        "description": "Comprehensive security suite covering up to 10 devices with all premium features and 75GB cloud backup.",
        "category": "Norton 360",
        "box_variant": "amber",
        "image_url": "",
        "features": ["Real-time threat protection", "Secure VPN", "Password Manager", "75GB Cloud Backup", "Parental Controls", "SafeCam"],
        "variants": [
            {"devices": 10, "years": 1, "label": "10 Devices / 1 Year", "price": 69.99, "original_price": 149.99},
            {"devices": 10, "years": 2, "label": "10 Devices / 2 Years", "price": 119.99, "original_price": 279.99},
        ],
    },
]

DEFAULT_COUPONS = [
    {"code": "WELCOME10", "description": "10% off your first order", "discount_type": "percent", "discount_value": 10, "max_uses": 1000, "min_order": 0, "is_active": True},
    {"code": "SAVE20", "description": "$20 off orders over $80", "discount_type": "fixed", "discount_value": 20, "max_uses": 1000, "min_order": 80, "is_active": True},
    {"code": "FLASH70", "description": "Flash sale — 70% off (limited)", "discount_type": "percent", "discount_value": 70, "max_uses": 100, "min_order": 0, "is_active": True},
]

DEFAULT_BANNER = {
    "id": "site-banner",
    "title": "MEGA SAVINGS EVENT",
    "message": "Save up to 70% + extra 10% off with code WELCOME10 — instant email delivery",
    "coupon_code": "FLASH70",
    "expires_at": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(),
    "is_active": True,
}

async def seed_data():
    admin = await db.admins.find_one({"email": ADMIN_EMAIL})
    if not admin:
        pw_hash = bcrypt.hashpw(ADMIN_PASSWORD.encode(), bcrypt.gensalt()).decode()
        await db.admins.insert_one({"email": ADMIN_EMAIL, "password_hash": pw_hash, "created_at": now_iso()})
        logger.info(f"Seeded admin: {ADMIN_EMAIL}")

    meta = await db.meta.find_one({"key": "seed_version"})
    if not meta or meta.get("value") != SEED_VERSION:
        await db.products.delete_many({})
        for p in NORTON_PRODUCTS:
            variants = [Variant(**v).model_dump() for v in p["variants"]]
            product = Product(**{**p, "variants": variants})
            await db.products.insert_one(product.model_dump())
        await db.meta.update_one({"key": "seed_version"}, {"$set": {"value": SEED_VERSION}}, upsert=True)
        logger.info(f"Reseeded {len(NORTON_PRODUCTS)} products (version={SEED_VERSION})")

    # Coupons
    for c in DEFAULT_COUPONS:
        existing = await db.coupons.find_one({"code": c["code"]})
        if not existing:
            doc = {**c, "id": str(uuid.uuid4()), "current_uses": 0, "created_at": now_iso()}
            await db.coupons.insert_one(doc)

    # Banner
    existing_banner = await db.banner.find_one({"id": "site-banner"})
    if not existing_banner:
        await db.banner.insert_one(DEFAULT_BANNER)

@app.on_event("startup")
async def startup():
    await seed_data()

# ============ COUPON MODELS ============
class Coupon(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    description: str = ""
    discount_type: str = "percent"  # percent | fixed
    discount_value: float
    max_uses: int = 1000
    current_uses: int = 0
    min_order: float = 0
    is_active: bool = True
    expires_at: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)

class CouponCreate(BaseModel):
    code: str
    description: str = ""
    discount_type: str = "percent"
    discount_value: float
    max_uses: int = 1000
    min_order: float = 0
    is_active: bool = True
    expires_at: Optional[str] = None

class CouponUpdate(BaseModel):
    description: Optional[str] = None
    discount_value: Optional[float] = None
    max_uses: Optional[int] = None
    min_order: Optional[float] = None
    is_active: Optional[bool] = None
    expires_at: Optional[str] = None

class ValidateCoupon(BaseModel):
    code: str
    subtotal: float

class Banner(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "site-banner"
    title: str
    message: str
    coupon_code: Optional[str] = None
    expires_at: Optional[str] = None
    is_active: bool = True

class BannerUpdate(BaseModel):
    title: Optional[str] = None
    message: Optional[str] = None
    coupon_code: Optional[str] = None
    expires_at: Optional[str] = None
    is_active: Optional[bool] = None

# ============ EMAIL ============
async def send_email(to: str, subject: str, html: str, cc: Optional[List[str]] = None):
    if not RESEND_API_KEY:
        logger.info(f"[EMAIL MOCK] To: {to} | CC: {cc} | Subject: {subject}")
        logger.info(f"[EMAIL MOCK BODY] {html[:200]}...")
        return {"id": "mock-" + str(uuid.uuid4()), "mocked": True}
    try:
        params = {"from": SENDER_EMAIL, "to": [to], "subject": subject, "html": html}
        if cc:
            params["cc"] = cc
        result = await asyncio.to_thread(resend.Emails.send, params)
        return result
    except Exception as e:
        err = str(e)
        logger.error(f"Email send failed (to={to}, cc={cc}): {err}")
        # Fallback: if failing because of unverified CC recipients (Resend testing mode),
        # retry once without CC so the primary recipient still receives the email.
        if cc and "verify a domain" in err.lower():
            try:
                params2 = {"from": SENDER_EMAIL, "to": [to], "subject": subject, "html": html}
                result = await asyncio.to_thread(resend.Emails.send, params2)
                logger.warning(f"Email retried without CC — primary only. Verify domain at resend.com/domains to enable CC to {cc}")
                return result
            except Exception as e2:
                logger.error(f"Email retry (no cc) also failed: {e2}")
                return {"error": str(e2)}
        return {"error": err}

def order_confirmation_html(order: dict) -> str:
    items_html = "".join([
        f"<tr><td style='padding:8px;border-bottom:1px solid #eee'>{it['product_name']}<br><small style='color:#666'>{it['variant_label']}</small></td>"
        f"<td style='padding:8px;border-bottom:1px solid #eee;text-align:center'>{it['quantity']}</td>"
        f"<td style='padding:8px;border-bottom:1px solid #eee;text-align:right'>${it['subtotal']:.2f}</td></tr>"
        for it in order['items']
    ])
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9fafb">
      <div style="background:#0A0A0A;padding:24px;border-radius:8px 8px 0 0">
        <h1 style="color:#FCE029;margin:0;font-size:24px">{STORE_NAME}</h1>
      </div>
      <div style="background:#fff;padding:32px;border-radius:0 0 8px 8px">
        <h2 style="color:#0A0A0A">Order Confirmed!</h2>
        <p>Hi {order['customer_name']}, thank you for your order.</p>
        <p><strong>Order Number:</strong> {order['order_number']}</p>
        <div style="background:#FEF9C3;padding:16px;border-radius:6px;margin:16px 0;border-left:4px solid #FCE029">
          <strong>Delivery in 5-15 minutes:</strong> Your Norton license key(s) will be emailed to you shortly after our team verifies your payment.
        </div>
        <table style="width:100%;border-collapse:collapse;margin:24px 0">
          <thead><tr style="background:#F3F4F6"><th style="padding:8px;text-align:left">Product</th><th style="padding:8px">Qty</th><th style="padding:8px;text-align:right">Total</th></tr></thead>
          <tbody>{items_html}</tbody>
          <tfoot><tr><td colspan="2" style="padding:12px;text-align:right;font-weight:bold">Total:</td><td style="padding:12px;text-align:right;font-weight:bold">${order['total']:.2f}</td></tr></tfoot>
        </table>
        <p>Track your order: <a href="{STORE_URL}/track">{STORE_URL}/track</a></p>
        <p style="color:#6B7280;font-size:12px;margin-top:24px">© {STORE_NAME}. Trusted digital software store.</p>
      </div>
    </div>
    """

def license_delivery_html(order: dict) -> str:
    keys_html = "".join([
        f"<div style='background:#F9FAFB;border:1px solid #E5E7EB;border-radius:6px;padding:16px;margin:12px 0'>"
        f"<div style='font-weight:600;color:#0A0A0A'>{it['product_name']}</div>"
        f"<div style='color:#6B7280;font-size:14px;margin-bottom:8px'>{it['variant_label']}</div>"
        f"<div style='font-family:monospace;background:#0A0A0A;color:#FCE029;padding:12px;border-radius:4px;letter-spacing:2px;font-size:16px;word-break:break-all'>{it.get('license_key','[Key not yet assigned]')}</div>"
        f"</div>"
        for it in order['items']
    ])
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9fafb">
      <div style="background:#0A0A0A;padding:24px;border-radius:8px 8px 0 0">
        <h1 style="color:#FCE029;margin:0;font-size:24px">{STORE_NAME}</h1>
      </div>
      <div style="background:#fff;padding:32px;border-radius:0 0 8px 8px">
        <h2 style="color:#10B981">Your Norton License Keys</h2>
        <p>Hi {order['customer_name']}, your license keys are ready!</p>
        <p><strong>Order:</strong> {order['order_number']}</p>
        {keys_html}
        <h3 style="margin-top:32px">How to activate:</h3>
        <ol style="color:#374151;line-height:1.8">
          <li>Go to <a href="https://my.norton.com">my.norton.com</a> and sign in (or create an account)</li>
          <li>Click "Enter a new product key"</li>
          <li>Paste your license key above and click "Next"</li>
          <li>Download and install Norton on your device</li>
        </ol>
        <p style="color:#6B7280;font-size:12px;margin-top:24px">Need help? Reply to this email.</p>
      </div>
    </div>
    """

# ============ PUBLIC ROUTES ============
@api_router.get("/")
async def root():
    return {"message": "BuyInstantKeys API", "paypal_enabled": PAYPAL_ENABLED, "email_enabled": bool(RESEND_API_KEY)}

@api_router.get("/config")
async def config():
    return {"paypal_enabled": PAYPAL_ENABLED, "paypal_client_id": PAYPAL_CLIENT_ID if PAYPAL_ENABLED else "", "paypal_mode": PAYPAL_MODE}

@api_router.get("/products", response_model=List[Product])
async def list_products(category: Optional[str] = None, featured: Optional[bool] = None):
    q = {"is_active": True}
    if category:
        q["category"] = category
    if featured is not None:
        q["is_featured"] = featured
    docs = await db.products.find(q, {"_id": 0}).sort("created_at", 1).to_list(200)
    return [Product(**d) for d in docs]

@api_router.get("/products/{slug}", response_model=Product)
async def get_product(slug: str):
    doc = await db.products.find_one({"slug": slug, "is_active": True}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    return Product(**doc)

@api_router.post("/orders", response_model=Order)
async def create_order(body: OrderCreate):
    if not body.items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    # Validate items and recompute totals from DB
    validated_items = []
    subtotal = 0.0
    for it in body.items:
        prod = await db.products.find_one({"id": it.product_id, "is_active": True}, {"_id": 0})
        if not prod:
            raise HTTPException(status_code=400, detail=f"Product not found: {it.product_id}")
        variant = next((v for v in prod["variants"] if v["id"] == it.variant_id), None)
        if not variant:
            raise HTTPException(status_code=400, detail=f"Variant not found for {prod['name']}")
        qty = max(1, int(it.quantity))
        line_subtotal = round(variant["price"] * qty, 2)
        subtotal += line_subtotal
        validated_items.append(OrderItem(
            product_id=prod["id"], product_name=prod["name"],
            variant_id=variant["id"], variant_label=variant["label"],
            unit_price=variant["price"], quantity=qty, subtotal=line_subtotal,
        ))
    subtotal = round(subtotal, 2)
    discount_amount = 0.0
    coupon_code = None
    if body.coupon_code:
        code_up = body.coupon_code.strip().upper()
        coupon = await db.coupons.find_one({"code": code_up, "is_active": True}, {"_id": 0})
        if coupon:
            if coupon.get("current_uses", 0) < coupon.get("max_uses", 0) and subtotal >= coupon.get("min_order", 0):
                if coupon["discount_type"] == "percent":
                    discount_amount = round(subtotal * (coupon["discount_value"] / 100), 2)
                else:
                    discount_amount = min(round(coupon["discount_value"], 2), subtotal)
                coupon_code = code_up
                await db.coupons.update_one({"code": code_up}, {"$inc": {"current_uses": 1}})
    total = round(max(0, subtotal - discount_amount), 2)
    order_number = "BIK-" + datetime.now(timezone.utc).strftime("%Y%m%d") + "-" + uuid.uuid4().hex[:6].upper()
    order = Order(
        order_number=order_number, customer_name=body.customer_name,
        customer_email=body.customer_email,
        customer_phone=body.customer_phone, customer_address=body.customer_address,
        items=validated_items,
        subtotal=subtotal, discount_amount=discount_amount, coupon_code=coupon_code,
        total=total,
    )
    await db.orders.insert_one(order.model_dump())
    return order

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    doc = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")
    return Order(**doc)

@api_router.post("/orders/track", response_model=Order)
async def track_order(body: OrderTrackQuery):
    doc = await db.orders.find_one({"order_number": body.order_number, "customer_email": body.email.lower()}, {"_id": 0})
    if not doc:
        # try case insensitive
        doc = await db.orders.find_one({"order_number": body.order_number}, {"_id": 0})
        if not doc or doc["customer_email"].lower() != body.email.lower():
            raise HTTPException(status_code=404, detail="Order not found. Check your email and order number.")
    return Order(**doc)

# ============ PAYMENT ============
async def _paypal_access_token():
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.post(
            f"{PAYPAL_BASE}/v1/oauth2/token",
            auth=(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET),
            data={"grant_type": "client_credentials"},
            headers={"Accept": "application/json"},
        )
        r.raise_for_status()
        return r.json()["access_token"]

@api_router.post("/orders/{order_id}/paypal/create")
async def create_paypal_order(order_id: str):
    if not PAYPAL_ENABLED:
        raise HTTPException(status_code=400, detail="PayPal not configured")
    doc = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")
    if doc["status"] != "pending":
        raise HTTPException(status_code=400, detail="Order already processed")
    token = await _paypal_access_token()
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.post(
            f"{PAYPAL_BASE}/v2/checkout/orders",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json={
                "intent": "CAPTURE",
                "purchase_units": [{
                    "reference_id": doc["order_number"],
                    "description": f"{STORE_NAME} order {doc['order_number']}",
                    "amount": {"currency_code": "USD", "value": f"{doc['total']:.2f}"},
                }],
            },
        )
        r.raise_for_status()
        pp = r.json()
    await db.orders.update_one({"id": order_id}, {"$set": {"paypal_order_id": pp["id"]}})
    return {"paypal_order_id": pp["id"]}

@api_router.post("/orders/{order_id}/paypal/capture")
async def capture_paypal_order(order_id: str, body: dict):
    if not PAYPAL_ENABLED:
        raise HTTPException(status_code=400, detail="PayPal not configured")
    doc = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")
    paypal_order_id = body.get("paypal_order_id") or doc.get("paypal_order_id")
    token = await _paypal_access_token()
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.post(
            f"{PAYPAL_BASE}/v2/checkout/orders/{paypal_order_id}/capture",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        )
        r.raise_for_status()
        cap = r.json()
    if cap.get("status") == "COMPLETED":
        await db.orders.update_one({"id": order_id}, {"$set": {
            "status": "paid", "payment_method": "paypal",
            "paypal_order_id": paypal_order_id, "paid_at": now_iso(),
        }})
        updated = await db.orders.find_one({"id": order_id}, {"_id": 0})
        await send_email(updated["customer_email"], f"Order {updated['order_number']} confirmed — {STORE_NAME}", order_confirmation_html(updated))
        await send_email(STORE_NOTIFICATION_EMAIL, f"New paid order {updated['order_number']}", f"<p>New paid order: {updated['order_number']} — ${updated['total']:.2f}</p><p>Login to admin panel to deliver keys.</p>")
    return {"status": cap.get("status"), "order_id": order_id}

@api_router.post("/orders/{order_id}/simulate-payment")
async def simulate_payment(order_id: str):
    """Mock payment for when PayPal not configured. Marks order as paid."""
    doc = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")
    if doc["status"] != "pending":
        raise HTTPException(status_code=400, detail="Order already processed")
    await db.orders.update_one({"id": order_id}, {"$set": {
        "status": "paid", "payment_method": "simulated",
        "paid_at": now_iso(),
    }})
    updated = await db.orders.find_one({"id": order_id}, {"_id": 0})
    await send_email(updated["customer_email"], f"Order {updated['order_number']} confirmed — {STORE_NAME}", order_confirmation_html(updated))
    await send_email(STORE_NOTIFICATION_EMAIL, f"New paid order {updated['order_number']}", f"<p>Order {updated['order_number']} — ${updated['total']:.2f}</p>")
    return {"status": "paid", "order_id": order_id}

# ============ ADMIN ============
@api_router.post("/admin/login")
async def admin_login(body: AdminLogin):
    admin = await db.admins.find_one({"email": body.email.lower()})
    if not admin:
        # fallback: env-configured admin (case-insensitive compare)
        if body.email.lower() == ADMIN_EMAIL.lower():
            admin = await db.admins.find_one({"email": ADMIN_EMAIL})
        if not admin:
            raise HTTPException(status_code=401, detail="Invalid credentials")
    if not bcrypt.checkpw(body.password.encode(), admin["password_hash"].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(admin["email"])
    return {"token": token, "email": admin["email"]}

@api_router.get("/admin/stats")
async def admin_stats(admin_email: str = Depends(verify_admin)):
    total_orders = await db.orders.count_documents({})
    pending = await db.orders.count_documents({"status": "pending"})
    paid = await db.orders.count_documents({"status": "paid"})
    delivered = await db.orders.count_documents({"status": "delivered"})
    products = await db.products.count_documents({"is_active": True})
    revenue_docs = await db.orders.find({"status": {"$in": ["paid", "delivered"]}}, {"total": 1, "_id": 0}).to_list(10000)
    revenue = round(sum(d.get("total", 0) for d in revenue_docs), 2)
    return {"total_orders": total_orders, "pending": pending, "paid": paid, "delivered": delivered, "products": products, "revenue": revenue}

@api_router.get("/admin/orders", response_model=List[Order])
async def admin_list_orders(status: Optional[str] = None, admin_email: str = Depends(verify_admin)):
    q = {}
    if status:
        q["status"] = status
    docs = await db.orders.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [Order(**d) for d in docs]

@api_router.post("/admin/orders/{order_id}/deliver")
async def admin_deliver(order_id: str, body: DeliverKeysBody, admin_email: str = Depends(verify_admin)):
    doc = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")
    if doc["status"] != "paid":
        raise HTTPException(status_code=400, detail="Order is not in paid state")
    # keys is list ordered by item index: [{"license_key": "..."}]
    items = doc["items"]
    if len(body.keys) != len(items):
        raise HTTPException(status_code=400, detail=f"Provide {len(items)} keys (one per item)")
    for i, item in enumerate(items):
        item["license_key"] = body.keys[i].get("license_key", "").strip()
    await db.orders.update_one({"id": order_id}, {"$set": {
        "items": items, "status": "delivered",
        "delivered_at": now_iso(), "admin_notes": body.admin_note,
    }})
    updated = await db.orders.find_one({"id": order_id}, {"_id": 0})
    await send_email(updated["customer_email"], f"Your Norton License Keys — Order {updated['order_number']}", license_delivery_html(updated))
    return {"status": "delivered", "order_id": order_id}

@api_router.post("/admin/orders/{order_id}/cancel")
async def admin_cancel(order_id: str, admin_email: str = Depends(verify_admin)):
    await db.orders.update_one({"id": order_id}, {"$set": {"status": "cancelled"}})
    return {"status": "cancelled"}

@api_router.get("/admin/products", response_model=List[Product])
async def admin_list_products(admin_email: str = Depends(verify_admin)):
    docs = await db.products.find({}, {"_id": 0}).sort("created_at", 1).to_list(500)
    return [Product(**d) for d in docs]

@api_router.post("/admin/products", response_model=Product)
async def admin_create_product(body: ProductCreate, admin_email: str = Depends(verify_admin)):
    existing = await db.products.find_one({"slug": body.slug})
    if existing:
        raise HTTPException(status_code=400, detail="Slug already exists")
    variants = [Variant(**v.model_dump()) for v in body.variants]
    product = Product(**body.model_dump(exclude={"variants"}), variants=variants)
    await db.products.insert_one(product.model_dump())
    return product

@api_router.patch("/admin/products/{product_id}", response_model=Product)
async def admin_update_product(product_id: str, body: ProductUpdate, admin_email: str = Depends(verify_admin)):
    update = {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None}
    if "variants" in update:
        update["variants"] = [Variant(**v).model_dump() if not isinstance(v, dict) else v for v in update["variants"]]
    await db.products.update_one({"id": product_id}, {"$set": update})
    doc = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    return Product(**doc)

@api_router.delete("/admin/products/{product_id}")
async def admin_delete_product(product_id: str, admin_email: str = Depends(verify_admin)):
    await db.products.update_one({"id": product_id}, {"$set": {"is_active": False}})
    return {"status": "deleted"}

# ============ COUPONS ============
@api_router.post("/coupons/validate")
async def validate_coupon(body: ValidateCoupon):
    code_up = body.code.strip().upper()
    coupon = await db.coupons.find_one({"code": code_up, "is_active": True}, {"_id": 0})
    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid coupon code")
    if coupon.get("current_uses", 0) >= coupon.get("max_uses", 0):
        raise HTTPException(status_code=400, detail="Coupon has reached its usage limit")
    if body.subtotal < coupon.get("min_order", 0):
        raise HTTPException(status_code=400, detail=f"Minimum order of ${coupon['min_order']:.2f} required")
    if coupon["discount_type"] == "percent":
        discount = round(body.subtotal * (coupon["discount_value"] / 100), 2)
    else:
        discount = min(round(coupon["discount_value"], 2), body.subtotal)
    return {
        "code": coupon["code"], "description": coupon["description"],
        "discount_type": coupon["discount_type"], "discount_value": coupon["discount_value"],
        "discount_amount": discount, "new_total": round(body.subtotal - discount, 2),
    }

@api_router.get("/admin/coupons", response_model=List[Coupon])
async def admin_list_coupons(admin_email: str = Depends(verify_admin)):
    docs = await db.coupons.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [Coupon(**d) for d in docs]

@api_router.post("/admin/coupons", response_model=Coupon)
async def admin_create_coupon(body: CouponCreate, admin_email: str = Depends(verify_admin)):
    body_up = body.model_dump()
    body_up["code"] = body_up["code"].strip().upper()
    if await db.coupons.find_one({"code": body_up["code"]}):
        raise HTTPException(status_code=400, detail="Coupon code already exists")
    coupon = Coupon(**body_up)
    await db.coupons.insert_one(coupon.model_dump())
    return coupon

@api_router.patch("/admin/coupons/{coupon_id}", response_model=Coupon)
async def admin_update_coupon(coupon_id: str, body: CouponUpdate, admin_email: str = Depends(verify_admin)):
    upd = {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None}
    await db.coupons.update_one({"id": coupon_id}, {"$set": upd})
    doc = await db.coupons.find_one({"id": coupon_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Coupon not found")
    return Coupon(**doc)

@api_router.delete("/admin/coupons/{coupon_id}")
async def admin_delete_coupon(coupon_id: str, admin_email: str = Depends(verify_admin)):
    await db.coupons.delete_one({"id": coupon_id})
    return {"status": "deleted"}

# ============ BANNER ============
@api_router.get("/banner")
async def get_banner():
    doc = await db.banner.find_one({"id": "site-banner"}, {"_id": 0})
    if not doc or not doc.get("is_active"):
        return None
    return doc

@api_router.patch("/admin/banner")
async def admin_update_banner(body: BannerUpdate, admin_email: str = Depends(verify_admin)):
    upd = {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None}
    await db.banner.update_one({"id": "site-banner"}, {"$set": upd}, upsert=True)
    doc = await db.banner.find_one({"id": "site-banner"}, {"_id": 0})
    return doc

# ============ ACTIVATION REQUESTS ============
class ActivationCreate(BaseModel):
    customer_name: str
    customer_email: EmailStr
    customer_phone: Optional[str] = None
    product_key: str

class ActivationRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_name: str
    customer_email: str
    customer_phone: Optional[str] = None
    product_key: str
    status: str = "pending"  # pending, activated, contacted
    admin_notes: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)

def activation_admin_html(req: dict) -> str:
    phone_html = f"<p><strong>Phone:</strong> {req['customer_phone']}</p>" if req.get('customer_phone') else ""
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;padding:20px">
      <h2>New activation request received</h2>
      <p><strong>Name:</strong> {req['customer_name']}</p>
      <p><strong>Email:</strong> {req['customer_email']}</p>
      {phone_html}
      <p><strong>Product Key:</strong> <code style="background:#f3f4f6;padding:6px 8px;border-radius:4px;font-family:monospace">{req['product_key']}</code></p>
      <p><strong>Received:</strong> {req['created_at']}</p>
      <p>Please contact this customer to help complete their Norton activation.</p>
    </div>
    """

def activation_customer_html(req: dict) -> str:
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9fafb">
      <div style="background:#0A0A0A;padding:24px;border-radius:8px 8px 0 0">
        <h1 style="color:#FCE029;margin:0;font-size:24px">{STORE_NAME}</h1>
      </div>
      <div style="background:#fff;padding:32px;border-radius:0 0 8px 8px">
        <h2 style="color:#0A0A0A">We received your activation request</h2>
        <p>Hi {req['customer_name']},</p>
        <p>Thanks for submitting your Norton product key. Our activation team is reviewing your request and will reach out within a few minutes with activation instructions or direct help.</p>
        <div style="background:#FEF9C3;padding:16px;border-radius:6px;margin:16px 0;border-left:4px solid #FCE029">
          Reference key ending: <code style="font-family:monospace">****-****-{req['product_key'][-4:] if len(req['product_key']) >= 4 else req['product_key']}</code>
        </div>
        <p>Need urgent help? Reply to this email or click <a href="{STORE_URL}/activation/thanks">here to chat with us</a>.</p>
        <p style="color:#6B7280;font-size:12px;margin-top:24px">© {STORE_NAME}. Norton is a trademark of Gen Digital Inc.</p>
      </div>
    </div>
    """

@api_router.post("/activations", response_model=ActivationRequest)
async def create_activation(body: ActivationCreate):
    if not body.product_key.strip():
        raise HTTPException(status_code=400, detail="Product key is required")
    req = ActivationRequest(
        customer_name=body.customer_name.strip(),
        customer_email=body.customer_email.lower(),
        customer_phone=body.customer_phone.strip() if body.customer_phone else None,
        product_key=body.product_key.strip(),
    )
    await db.activations.insert_one(req.model_dump())
    doc = req.model_dump()
    # Notify activation team (primary: hexkeyllc@gmail.com, cc: info@buyinstantkeys.com)
    await send_email(
        to="hexkeyllc@gmail.com",
        cc=["info@buyinstantkeys.com"],
        subject=f"[Activation] {req.customer_name} — key ****{req.product_key[-4:] if len(req.product_key) >= 4 else req.product_key}",
        html=activation_admin_html(doc),
    )
    # Confirmation to the customer
    await send_email(
        to=req.customer_email,
        subject=f"Activation request received — {STORE_NAME}",
        html=activation_customer_html(doc),
    )
    return req

@api_router.get("/admin/activations", response_model=List[ActivationRequest])
async def admin_list_activations(status: Optional[str] = None, admin_email: str = Depends(verify_admin)):
    q = {}
    if status:
        q["status"] = status
    docs = await db.activations.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [ActivationRequest(**d) for d in docs]

@api_router.patch("/admin/activations/{req_id}")
async def admin_update_activation(req_id: str, body: dict, admin_email: str = Depends(verify_admin)):
    upd = {k: v for k, v in body.items() if v is not None and k in ("status", "admin_notes")}
    await db.activations.update_one({"id": req_id}, {"$set": upd})
    doc = await db.activations.find_one({"id": req_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    return doc

app.include_router(api_router)

# Serve React static files
if FRONTEND_BUILD.exists():
    # Mount static files directory
    app.mount("/static", StaticFiles(directory=str(FRONTEND_BUILD / "static")), name="static")
    
    # Serve index.html for root path
    @app.get("/")
    async def serve_root():
        index_file = FRONTEND_BUILD / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        raise HTTPException(status_code=404, detail="Frontend not built. Run 'npm run build' in frontend directory.")
    
    # SPA routes - handle common frontend routes
    @app.get("/products")
    async def serve_products():
        index_file = FRONTEND_BUILD / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        raise HTTPException(status_code=404, detail="Frontend not built.")
    
    @app.get("/product/{slug}")
    async def serve_product_detail(slug: str):
        index_file = FRONTEND_BUILD / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        raise HTTPException(status_code=404, detail="Frontend not built.")
    
    @app.get("/faq")
    async def serve_faq():
        index_file = FRONTEND_BUILD / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        raise HTTPException(status_code=404, detail="Frontend not built.")
    
    @app.get("/contact")
    async def serve_contact():
        index_file = FRONTEND_BUILD / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        raise HTTPException(status_code=404, detail="Frontend not built.")
    
    @app.get("/about")
    async def serve_about():
        index_file = FRONTEND_BUILD / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        raise HTTPException(status_code=404, detail="Frontend not built.")
    
    @app.get("/activation")
    async def serve_activation():
        index_file = FRONTEND_BUILD / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        raise HTTPException(status_code=404, detail="Frontend not built.")
    
    @app.get("/activation/thanks")
    async def serve_activation_thanks():
        index_file = FRONTEND_BUILD / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        raise HTTPException(status_code=404, detail="Frontend not built.")
    
    @app.get("/track")
    async def serve_track():
        index_file = FRONTEND_BUILD / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        raise HTTPException(status_code=404, detail="Frontend not built.")
    
    @app.get("/digital-delivery")
    async def serve_digital_delivery():
        index_file = FRONTEND_BUILD / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        raise HTTPException(status_code=404, detail="Frontend not built.")
    
    @app.get("/terms")
    async def serve_terms():
        index_file = FRONTEND_BUILD / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        raise HTTPException(status_code=404, detail="Frontend not built.")
    
    @app.get("/privacy-policy")
    async def serve_privacy():
        index_file = FRONTEND_BUILD / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        raise HTTPException(status_code=404, detail="Frontend not built.")
    
    @app.get("/refund-policy")
    async def serve_refund():
        index_file = FRONTEND_BUILD / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        raise HTTPException(status_code=404, detail="Frontend not built.")
    
    @app.get("/disclaimer")
    async def serve_disclaimer():
        index_file = FRONTEND_BUILD / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        raise HTTPException(status_code=404, detail="Frontend not built.")
    
    @app.get("/category/{category}")
    async def serve_category(category: str):
        index_file = FRONTEND_BUILD / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        raise HTTPException(status_code=404, detail="Frontend not built.")
    
    @app.get("/admin/login")
    async def serve_admin_login():
        index_file = FRONTEND_BUILD / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        raise HTTPException(status_code=404, detail="Frontend not built.")
    
    @app.get("/admin")
    async def serve_admin():
        index_file = FRONTEND_BUILD / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        raise HTTPException(status_code=404, detail="Frontend not built.")
else:
    logger.warning(f"Frontend build directory not found at {FRONTEND_BUILD}. SPA routing disabled.")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
