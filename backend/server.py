from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
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
    image_url: str
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
    items: List[OrderItem]

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_number: str
    customer_name: str
    customer_email: str
    items: List[OrderItem]
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
NORTON_PRODUCTS = [
    {
        "slug": "norton-360-deluxe",
        "name": "Norton 360 Deluxe",
        "tagline": "Award-winning protection for up to 5 devices",
        "description": "Multi-layered security with VPN, password manager, dark web monitoring, PC cloud backup and parental controls. Trusted by millions worldwide.",
        "category": "Norton 360",
        "image_url": "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=600",
        "badge": "Best Seller",
        "features": ["Real-time threat protection", "Secure VPN", "Password Manager", "50GB Cloud Backup", "Parental Controls", "SafeCam for PC"],
        "variants": [
            {"devices": 3, "years": 1, "label": "3 Devices / 1 Year", "price": 29.99, "original_price": 89.99},
            {"devices": 5, "years": 1, "label": "5 Devices / 1 Year", "price": 39.99, "original_price": 104.99},
            {"devices": 5, "years": 2, "label": "5 Devices / 2 Years", "price": 69.99, "original_price": 209.99},
        ],
        "is_featured": True,
    },
    {
        "slug": "norton-360-standard",
        "name": "Norton 360 Standard",
        "tagline": "Complete protection for 1 device",
        "description": "Powerful, real-time protection against viruses, ransomware, malware and other online threats for a single device.",
        "category": "Norton 360",
        "image_url": "https://images.unsplash.com/photo-1614064548237-096f735f344f?w=600",
        "features": ["Real-time threat protection", "Secure VPN", "Password Manager", "10GB Cloud Backup", "SafeCam for PC"],
        "variants": [
            {"devices": 1, "years": 1, "label": "1 Device / 1 Year", "price": 19.99, "original_price": 59.99},
            {"devices": 1, "years": 2, "label": "1 Device / 2 Years", "price": 34.99, "original_price": 119.99},
        ],
        "is_featured": True,
    },
    {
        "slug": "norton-360-premium",
        "name": "Norton 360 Premium",
        "tagline": "Advanced protection for up to 10 devices",
        "description": "Comprehensive security suite covering up to 10 devices with all premium features and 75GB of cloud backup.",
        "category": "Norton 360",
        "image_url": "https://images.unsplash.com/photo-1633265486064-086b219458ec?w=600",
        "features": ["Real-time threat protection", "Secure VPN", "Password Manager", "75GB Cloud Backup", "Parental Controls", "SafeCam"],
        "variants": [
            {"devices": 10, "years": 1, "label": "10 Devices / 1 Year", "price": 49.99, "original_price": 124.99},
            {"devices": 10, "years": 2, "label": "10 Devices / 2 Years", "price": 89.99, "original_price": 249.99},
        ],
        "is_featured": True,
    },
    {
        "slug": "norton-360-advanced",
        "name": "Norton 360 Advanced",
        "tagline": "Ultimate protection with LifeLock identity monitoring",
        "description": "Our most comprehensive plan featuring identity theft protection, credit monitoring and up to 200GB cloud backup.",
        "category": "Norton 360",
        "image_url": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600",
        "badge": "Ultimate",
        "features": ["All Deluxe features", "Identity Theft Protection", "Credit Monitoring", "200GB Cloud Backup", "Social Media Monitoring"],
        "variants": [
            {"devices": 10, "years": 1, "label": "10 Devices / 1 Year", "price": 89.99, "original_price": 249.99},
        ],
        "is_featured": True,
    },
    {
        "slug": "norton-antivirus-plus",
        "name": "Norton AntiVirus Plus",
        "tagline": "Essential virus and malware protection",
        "description": "Powerful protection against viruses, malware, ransomware and hacking, with password manager and smart firewall.",
        "category": "AntiVirus",
        "image_url": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600",
        "features": ["Real-time protection", "Smart Firewall", "Password Manager", "2GB Cloud Backup"],
        "variants": [
            {"devices": 1, "years": 1, "label": "1 PC / 1 Year", "price": 14.99, "original_price": 39.99},
            {"devices": 1, "years": 2, "label": "1 PC / 2 Years", "price": 24.99, "original_price": 79.99},
        ],
    },
    {
        "slug": "norton-secure-vpn",
        "name": "Norton Secure VPN",
        "tagline": "Private, encrypted browsing anywhere",
        "description": "Bank-grade encryption to keep your online activity private on public Wi-Fi and unsecured networks.",
        "category": "Privacy",
        "image_url": "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600",
        "features": ["Bank-grade encryption", "No-log VPN", "Ad tracker blocking", "Wi-Fi security"],
        "variants": [
            {"devices": 1, "years": 1, "label": "1 Device / 1 Year", "price": 9.99, "original_price": 29.99},
            {"devices": 5, "years": 1, "label": "5 Devices / 1 Year", "price": 19.99, "original_price": 49.99},
            {"devices": 10, "years": 1, "label": "10 Devices / 1 Year", "price": 29.99, "original_price": 69.99},
        ],
    },
    {
        "slug": "norton-utilities-ultimate",
        "name": "Norton Utilities Ultimate",
        "tagline": "Speed up and clean your PC",
        "description": "Powerful tools to optimize PC performance, clean up junk files, and extend device life.",
        "category": "Utilities",
        "image_url": "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600",
        "features": ["PC cleaner", "Speed optimizer", "Privacy cleaner", "Disk defragmenter"],
        "variants": [
            {"devices": 10, "years": 1, "label": "10 PCs / 1 Year", "price": 19.99, "original_price": 39.99},
        ],
    },
    {
        "slug": "norton-family",
        "name": "Norton Family",
        "tagline": "Parental controls for kids online",
        "description": "Help keep your kids safer online with screen time limits, content filtering, location supervision and school time features.",
        "category": "Family",
        "image_url": "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=600",
        "features": ["Web supervision", "Screen time management", "Location tracking", "School time"],
        "variants": [
            {"devices": 999, "years": 1, "label": "Unlimited Devices / 1 Year", "price": 24.99, "original_price": 49.99},
        ],
    },
    {
        "slug": "norton-small-business",
        "name": "Norton Small Business",
        "tagline": "Protection built for small businesses",
        "description": "Easy-to-deploy protection for PCs, Macs, iOS and Android devices in your small business.",
        "category": "Business",
        "image_url": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600",
        "features": ["Multi-device deployment", "Cloud console", "24/7 support"],
        "variants": [
            {"devices": 5, "years": 1, "label": "5 Devices / 1 Year", "price": 49.99, "original_price": 99.99},
            {"devices": 10, "years": 1, "label": "10 Devices / 1 Year", "price": 89.99, "original_price": 149.99},
            {"devices": 20, "years": 1, "label": "20 Devices / 1 Year", "price": 149.99, "original_price": 249.99},
        ],
    },
    {
        "slug": "norton-360-for-gamers",
        "name": "Norton 360 for Gamers",
        "tagline": "Multi-layered protection for PC gamers",
        "description": "Game-optimized protection with Game Optimizer, notification blocker and full VPN — no interruptions to your gameplay.",
        "category": "Gaming",
        "image_url": "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600",
        "badge": "Gamer's Choice",
        "features": ["Game Optimizer", "Notification blocker", "Secure VPN", "Dark Web Monitoring"],
        "variants": [
            {"devices": 3, "years": 1, "label": "3 Devices / 1 Year", "price": 29.99, "original_price": 79.99},
        ],
    },
    {
        "slug": "norton-mobile-security",
        "name": "Norton Mobile Security",
        "tagline": "Powerful protection for iOS & Android",
        "description": "Safeguard your smartphone from cyber threats, malicious apps, phishing, and Wi-Fi risks.",
        "category": "Mobile",
        "image_url": "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=600",
        "features": ["App advisor", "Wi-Fi security", "Web protection", "SMS filtering"],
        "variants": [
            {"devices": 1, "years": 1, "label": "1 Device / 1 Year", "price": 9.99, "original_price": 29.99},
        ],
    },
    {
        "slug": "norton-password-manager",
        "name": "Norton Password Manager",
        "tagline": "Secure, generate and remember passwords",
        "description": "Store, generate, and autofill strong passwords in a secure encrypted vault across all your devices.",
        "category": "Privacy",
        "image_url": "https://images.unsplash.com/photo-1633265486501-0cf524a07213?w=600",
        "features": ["Encrypted vault", "Password generator", "Auto-fill", "Cross-device sync"],
        "variants": [
            {"devices": 999, "years": 1, "label": "Unlimited Devices / 1 Year", "price": 4.99, "original_price": 19.99},
        ],
    },
]

async def seed_data():
    # Seed admin
    admin = await db.admins.find_one({"email": ADMIN_EMAIL})
    if not admin:
        pw_hash = bcrypt.hashpw(ADMIN_PASSWORD.encode(), bcrypt.gensalt()).decode()
        await db.admins.insert_one({"email": ADMIN_EMAIL, "password_hash": pw_hash, "created_at": now_iso()})
        logger.info(f"Seeded admin: {ADMIN_EMAIL}")

    # Seed products
    count = await db.products.count_documents({})
    if count == 0:
        for p in NORTON_PRODUCTS:
            variants = [Variant(**v).model_dump() for v in p["variants"]]
            product = Product(**{**p, "variants": variants})
            await db.products.insert_one(product.model_dump())
        logger.info(f"Seeded {len(NORTON_PRODUCTS)} products")

@app.on_event("startup")
async def startup():
    await seed_data()

# ============ EMAIL ============
async def send_email(to: str, subject: str, html: str):
    if not RESEND_API_KEY:
        logger.info(f"[EMAIL MOCK] To: {to} | Subject: {subject}")
        logger.info(f"[EMAIL MOCK BODY] {html[:200]}...")
        return {"id": "mock-" + str(uuid.uuid4()), "mocked": True}
    try:
        params = {"from": SENDER_EMAIL, "to": [to], "subject": subject, "html": html}
        result = await asyncio.to_thread(resend.Emails.send, params)
        return result
    except Exception as e:
        logger.error(f"Email send failed: {e}")
        return {"error": str(e)}

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
    total = 0.0
    for it in body.items:
        prod = await db.products.find_one({"id": it.product_id, "is_active": True}, {"_id": 0})
        if not prod:
            raise HTTPException(status_code=400, detail=f"Product not found: {it.product_id}")
        variant = next((v for v in prod["variants"] if v["id"] == it.variant_id), None)
        if not variant:
            raise HTTPException(status_code=400, detail=f"Variant not found for {prod['name']}")
        qty = max(1, int(it.quantity))
        subtotal = round(variant["price"] * qty, 2)
        total += subtotal
        validated_items.append(OrderItem(
            product_id=prod["id"], product_name=prod["name"],
            variant_id=variant["id"], variant_label=variant["label"],
            unit_price=variant["price"], quantity=qty, subtotal=subtotal,
        ))
    total = round(total, 2)
    order_number = "BIK-" + datetime.now(timezone.utc).strftime("%Y%m%d") + "-" + uuid.uuid4().hex[:6].upper()
    order = Order(
        order_number=order_number, customer_name=body.customer_name,
        customer_email=body.customer_email, items=validated_items, total=total,
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
    if doc["status"] not in ("paid", "delivered"):
        raise HTTPException(status_code=400, detail="Order not paid yet")
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

app.include_router(api_router)
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
