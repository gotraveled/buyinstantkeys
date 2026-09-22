from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.gzip import GZipMiddleware
from starlette.responses import Response
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
from xml.etree.ElementTree import Element, SubElement, tostring

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
    description: str = ""
    long_description: str = ""
    category: str
    brand: str = "Norton"  # Norton | Webroot | McAfee
    image_url: str = ""
    box_variant: str = "gold"  # gold | amber | black | green | red | purple
    badge: Optional[str] = None
    features: List[str] = []
    variants: List[Variant] = []
    is_featured: bool = False
    is_active: bool = True
    source: str = "seed"  # seed | admin
    created_at: str = Field(default_factory=now_iso)

class ProductCreate(BaseModel):
    slug: str
    name: str
    tagline: str
    description: str = ""
    long_description: str = ""
    category: str
    brand: str = "Norton"
    image_url: str = ""
    box_variant: str = "gold"
    badge: Optional[str] = None
    features: List[str] = []
    variants: List[Variant] = []
    is_featured: bool = False
    is_active: bool = True

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    tagline: Optional[str] = None
    description: Optional[str] = None
    long_description: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    image_url: Optional[str] = None
    box_variant: Optional[str] = None
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
SEED_VERSION = "2026-09-v10-long-desc-cleanup"

PRODUCTS = [{'slug': 'norton-360-deluxe', 'name': 'Norton 360 Deluxe', 'brand': 'Norton', 'box_variant': 'gold', 'category': 'Norton 360', 'image_url': '', 'tagline': 'All-in-one security for up to 5 devices with VPN, dark web monitoring and 50 GB cloud backup.', 'description': 'Norton 360 Deluxe layers real-time antivirus, anti-ransomware and anti-phishing defense over your PCs, Macs, phones and tablets. A built-in Secure VPN keeps your connection private on public Wi-Fi, while Dark Web Monitoring watches for your personal data and Parental Controls help you manage what your kids see online. You also get a password manager and 50 GB of cloud backup to keep important files safe.', 'features': ['Real-time malware & ransomware protection', 'Secure VPN for private browsing', 'Dark Web Monitoring', '50 GB cloud backup', 'Password Manager', 'Parental Controls'], 'variants': [{'devices': 3, 'years': 1, 'label': '3 Devices / 1 Year', 'price': 46.99, 'original_price': 89.99}, {'devices': 5, 'years': 1, 'label': '5 Devices / 1 Year', 'price': 64.99, 'original_price': 104.99}], 'long_description': 'Norton 360 Deluxe covers the whole household under one subscription, wrapping real-time antivirus, anti-ransomware and anti-phishing defense around up to five PCs, Macs, phones and tablets.\n\nIt adds a Secure VPN for public Wi-Fi, Dark Web Monitoring for your personal data, a Password Manager, Parental Controls and 50 GB of cloud backup. It is a balanced, do-everything suite that stays out of your way until it matters.', 'source': 'seed'}, {'slug': 'norton-360-deluxe-lifelock', 'name': 'Norton 360 Deluxe with LifeLock Select', 'brand': 'Norton', 'box_variant': 'gold', 'category': 'Norton 360 LifeLock', 'image_url': '', 'tagline': 'Norton 360 Deluxe device security plus LifeLock identity theft protection for 5 devices.', 'description': "This bundle pairs Norton 360 Deluxe's full device security with LifeLock Select identity monitoring. Along with antivirus, a Secure VPN, password manager and 50 GB cloud backup for up to 5 devices, LifeLock watches for misuse of your personal information, alerts you to suspicious credit activity and helps restore your identity if it is ever compromised.", 'features': ['Complete security for 5 devices', 'LifeLock identity theft monitoring', 'Secure VPN & Password Manager', 'Dark web & credit alerts', '50 GB cloud backup', 'Identity restoration support'], 'variants': [{'devices': 5, 'years': 1, 'label': '5 Devices / 1 Year', 'price': 84.99, 'original_price': 124.99}], 'long_description': "This bundle pairs Norton 360 Deluxe's device security with LifeLock Select identity theft protection, covering your devices and your identity in one plan for up to five devices.\n\nYou get antivirus, a Secure VPN, Password Manager, Dark Web Monitoring and 50 GB of cloud backup, plus LifeLock monitoring that alerts you to suspicious credit or account activity. If identity theft occurs, restoration specialists help you recover, backed by reimbursement for eligible expenses.", 'source': 'seed'}, {'slug': 'norton-360-premium', 'name': 'Norton 360 Premium', 'brand': 'Norton', 'box_variant': 'gold', 'category': 'Norton 360', 'image_url': '', 'tagline': 'Premium protection for up to 10 devices with VPN, parental controls and 100 GB backup.', 'description': "Norton 360 Premium extends Norton's multi-layered security to as many as 10 devices, making it a strong fit for families. It combines antivirus and ransomware defense with a Secure VPN, Dark Web Monitoring, Parental Controls and a password manager, plus 100 GB of cloud backup so every device stays protected and your files stay recoverable.", 'features': ['Protects up to 10 devices', 'Secure VPN & SafeCam', 'Dark Web Monitoring', '100 GB cloud backup', 'Parental Controls', 'Password Manager'], 'variants': [{'devices': 10, 'years': 1, 'label': '10 Devices / 1 Year', 'price': 94.99, 'original_price': 139.99}], 'long_description': 'Norton 360 Premium is the family-sized tier, extending protection to as many as ten devices under one subscription for households with many laptops, phones and tablets.\n\nIt includes the full Norton feature set: antivirus and ransomware defense, a Secure VPN, Dark Web Monitoring, a Password Manager and Parental Controls, plus 100 GB of cloud backup. Managed from one account, it offers the best per-device value in the 360 range.', 'source': 'seed'}, {'slug': 'norton-360-standard', 'name': 'Norton 360 Standard', 'brand': 'Norton', 'box_variant': 'gold', 'category': 'Norton 360', 'image_url': '', 'tagline': 'Essential Norton 360 security for a single device with VPN and 10 GB backup.', 'description': "Norton 360 Standard delivers Norton's core protection for one PC, Mac, phone or tablet. It guards against viruses, ransomware and phishing in real time, adds a Secure VPN for private browsing, Dark Web Monitoring and a password manager, and includes 10 GB of cloud backup for your important files.", 'features': ['Real-time threat protection', 'Secure VPN', 'Dark Web Monitoring', '10 GB cloud backup', 'Password Manager', 'Smart Firewall'], 'variants': [{'devices': 1, 'years': 1, 'label': '1 Device / 1 Year', 'price': 44.99, 'original_price': 89.99}], 'long_description': "Norton 360 Standard is the entry point into the 360 family, built to protect a single device with the essentials done right.\n\nIt includes real-time protection against viruses, ransomware and phishing, a Secure VPN, Dark Web Monitoring, a Password Manager and 10 GB of cloud backup, backed by Norton's 100% Virus Protection Promise.", 'source': 'seed'}, {'slug': 'norton-secure-vpn', 'name': 'Norton Secure VPN', 'brand': 'Norton', 'box_variant': 'gold', 'category': 'Norton VPN', 'image_url': '', 'tagline': 'Bank-grade encryption for private browsing on up to 5 devices.', 'description': 'Norton Secure VPN encrypts your internet connection so you can browse, bank and shop privately, even on public Wi-Fi. It masks your IP address, helps block ad trackers and works across Windows, Mac, Android and iOS, all from a single easy-to-use app.', 'features': ['Bank-grade encryption', 'No-log VPN policy', 'Wi-Fi security on public networks', 'Ad-tracker blocking', 'Up to 5 devices', 'Windows, Mac, Android & iOS'], 'variants': [{'devices': 5, 'years': 1, 'label': '5 Devices / 1 Year', 'price': 49.99, 'original_price': 79.99}], 'long_description': 'Norton Secure VPN encrypts your internet connection so your browsing stays private, especially on public Wi-Fi where your data is most exposed.\n\nIt masks your IP address, uses bank-grade encryption and blocks ad trackers. The app runs on Windows, Mac, Android and iOS, and one subscription covers up to five devices.', 'source': 'seed'}, {'slug': 'norton-small-business', 'name': 'Norton Small Business', 'brand': 'Norton', 'box_variant': 'gold', 'category': 'Norton Small Business', 'image_url': '', 'tagline': 'Multi-device security built for small teams, protecting up to 10 devices.', 'description': 'Norton Small Business brings strong, easy-to-manage protection to growing teams without the IT overhead. Secure up to 10 devices with real-time threat defense, a Secure VPN, password manager and cloud backup, all managed through a simple, centralized experience designed for business owners.', 'features': ['Covers up to 10 devices', 'Real-time threat protection', 'Secure VPN', 'Password Manager', 'Cloud backup', 'Centralized management'], 'variants': [{'devices': 10, 'years': 1, 'label': '10 Devices / 1 Year', 'price': 74.99, 'original_price': 109.99}], 'long_description': 'Norton Small Business brings easy-to-manage security to teams without a dedicated IT department, protecting up to ten devices under one plan.\n\nEach device gets real-time threat defense, a Secure VPN for safe remote work, a Password Manager and cloud backup. Everything is managed centrally, so adding or removing devices takes minutes.', 'source': 'seed'}, {'slug': 'norton-utilities-ultimate', 'name': 'Norton Utilities Ultimate', 'brand': 'Norton', 'box_variant': 'gold', 'category': 'Norton Utilities', 'image_url': '', 'tagline': 'Clean, speed up and optimize up to 10 PCs automatically.', 'description': 'Norton Utilities Ultimate helps keep your PCs running like new. It clears junk files, fixes common issues, optimizes startup and frees up resources so your machines stay fast and responsive. Automated maintenance runs quietly in the background across up to 10 PCs.', 'features': ['Speeds up & cleans PCs', 'Automatic maintenance', 'Startup optimizer', 'Frees disk space & RAM', 'Fixes common PC issues', 'Supports up to 10 PCs'], 'variants': [{'devices': 10, 'years': 1, 'label': '10 PCs / 1 Year', 'price': 64.99, 'original_price': 99.99}], 'long_description': 'Norton Utilities Ultimate is a PC optimization tool, not an antivirus, designed to keep up to ten PCs running fast, clean and stable.\n\nIt clears junk files, fixes common performance issues, optimizes startup and runs automated maintenance in the background. It frees up RAM and disk space and can improve responsiveness on older hardware.', 'source': 'seed'}, {'slug': 'mcafee-antivirus', 'name': 'McAfee AntiVirus', 'brand': 'McAfee', 'box_variant': 'red', 'category': 'McAfee AntiVirus', 'image_url': '', 'tagline': 'Award-winning antivirus that keeps your PC safe from viruses and malware.', 'description': 'McAfee AntiVirus provides dependable, always-on protection for your PC. It scans for and removes viruses, malware, spyware and ransomware in real time, blocks risky downloads and websites, and runs quietly in the background so you stay protected without slowdowns.', 'features': ['Real-time virus & malware protection', 'Ransomware & spyware defense', 'Safe web browsing', 'Firewall network protection', 'Lightweight performance', 'Automatic updates'], 'variants': [{'devices': 1, 'years': 1, 'label': '1 PC / 1 Year', 'price': 34.99, 'original_price': 59.99}, {'devices': 1, 'years': 3, 'label': '1 PC / 3 Years', 'price': 44.99, 'original_price': 79.99}], 'long_description': 'McAfee AntiVirus is the focused, entry-level option, built to keep a single PC protected from the threats that matter most.\n\nIt provides real-time scanning that removes viruses, malware, spyware and ransomware, plus a firewall and safe-browsing warnings. Lightweight and quiet, it covers the essentials at a low cost.', 'source': 'seed'}, {'slug': 'mcafee-internet-security', 'name': 'McAfee Internet Security', 'brand': 'McAfee', 'box_variant': 'red', 'category': 'McAfee Internet Security', 'image_url': '', 'tagline': 'Complete online protection with antivirus, firewall and web safety for your devices.', 'description': 'McAfee Internet Security goes beyond basic antivirus to protect your whole online life. It combines real-time malware defense with a two-way firewall, anti-spam, safe-browsing warnings and a password manager, keeping your devices and personal data secure across Windows, Mac and mobile.', 'features': ['Antivirus & anti-malware', 'Two-way firewall', 'Safe web & anti-phishing', 'Password manager', 'Anti-spam protection', 'Multi-device coverage'], 'variants': [{'devices': 1, 'years': 1, 'label': '1 Device / 1 Year', 'price': 29.99, 'original_price': 49.99}, {'devices': 3, 'years': 1, 'label': '3 Devices / 1 Year', 'price': 39.99, 'original_price': 69.99}, {'devices': 5, 'years': 1, 'label': '5 Devices / 1 Year', 'price': 44.99, 'original_price': 79.99}, {'devices': 10, 'years': 1, 'label': '10 Devices / 1 Year', 'price': 54.99, 'original_price': 99.99}], 'long_description': 'McAfee Internet Security steps up from basic antivirus to protect your broader online activity across multiple devices.\n\nAlongside real-time antivirus it adds a two-way firewall, anti-spam, safe-browsing warnings and a password manager. It runs across Windows, Mac and mobile, balancing protection, features and price.', 'source': 'seed'}, {'slug': 'mcafee-mobile-security', 'name': 'McAfee Mobile Security', 'brand': 'McAfee', 'box_variant': 'red', 'category': 'McAfee Mobile Security', 'image_url': '', 'tagline': 'Security and privacy protection for your Android and iOS devices.', 'description': 'McAfee Mobile Security protects your smartphones and tablets from mobile threats, unsafe apps and risky Wi-Fi. It includes anti-theft tools, a secure VPN, app privacy checks and web protection so you can bank, shop and browse safely on the go.', 'features': ['Mobile malware protection', 'Secure VPN', 'Anti-theft & device locate', 'Wi-Fi security alerts', 'App privacy protection', 'Safe browsing'], 'variants': [{'devices': 1, 'years': 1, 'label': '1 Device / 1 Year', 'price': 24.99, 'original_price': 44.99}, {'devices': 10, 'years': 1, 'label': '10 Devices / 1 Year', 'price': 44.99, 'original_price': 79.99}], 'long_description': 'McAfee Mobile Security is purpose-built for smartphones and tablets, protecting Android and iOS devices from malicious apps, unsafe Wi-Fi and phishing links.\n\nIt includes a secure VPN, anti-theft tools to locate or lock a lost device, and app privacy checks. Web protection warns you before you tap a dangerous link.', 'source': 'seed'}, {'slug': 'mcafee-total-protection', 'name': 'McAfee Total Protection', 'brand': 'McAfee', 'box_variant': 'red', 'category': 'McAfee Total Protection', 'image_url': '', 'tagline': 'All-in-one security, privacy and identity protection for the whole family.', 'description': "McAfee Total Protection is McAfee's most complete suite, combining award-winning antivirus with identity monitoring, a Secure VPN, password manager and personal data cleanup. It protects your devices, your privacy and your identity across every platform, with continuous monitoring and real-time alerts.", 'features': ['Antivirus & ransomware protection', 'Secure VPN', 'Identity & dark web monitoring', 'Password manager', 'Personal data cleanup', 'Protects multiple devices'], 'variants': [{'devices': 1, 'years': 1, 'label': '1 Device / 1 Year', 'price': 39.99, 'original_price': 69.99}, {'devices': 5, 'years': 1, 'label': '5 Devices / 1 Year', 'price': 54.99, 'original_price': 99.99}, {'devices': 10, 'years': 1, 'label': '10 Devices / 1 Year', 'price': 64.99, 'original_price': 119.99}], 'long_description': 'McAfee Total Protection is the most complete suite, combining device security, privacy tools and identity protection in one subscription.\n\nOn top of antivirus and ransomware defense it adds a Secure VPN, a password manager, identity and dark web monitoring, and personal data cleanup. It is the all-in-one option for maximum coverage.', 'source': 'seed'}, {'slug': 'webroot-secureanywhere-antivirus', 'name': 'Webroot SecureAnywhere AntiVirus', 'brand': 'Webroot', 'box_variant': 'green', 'category': 'Webroot SecureAnywhere', 'image_url': '', 'tagline': "Lightning-fast, cloud-based antivirus that won't slow you down.", 'description': 'Webroot SecureAnywhere AntiVirus uses cloud-based threat intelligence to stop viruses, ransomware and phishing in real time, without bulky signature updates. It installs in seconds, scans in about 20 seconds and uses minimal system resources, so your PC stays fast and protected.', 'features': ['Cloud-based threat protection', 'Ultra-fast scans', 'Ransomware & phishing defense', 'Firewall & network monitor', 'Lightweight footprint', 'Real-time anti-phishing'], 'variants': [{'devices': 1, 'years': 1, 'label': '1 Device / 1 Year', 'price': 34.99, 'original_price': 49.99}, {'devices': 3, 'years': 1, 'label': '3 Devices / 1 Year', 'price': 49.99, 'original_price': 79.99}], 'long_description': 'Webroot SecureAnywhere AntiVirus uses cloud-based threat intelligence instead of heavy signature files, so protection stays remarkably light on your system.\n\nIt installs in seconds, uses little disk space and scans in about twenty seconds, while still delivering real-time defense against viruses, ransomware and phishing plus a firewall and network monitor.', 'source': 'seed'}, {'slug': 'webroot-internet-security-plus', 'name': 'Webroot Internet Security Plus', 'brand': 'Webroot', 'box_variant': 'green', 'category': 'Webroot Internet Security Plus', 'image_url': '', 'tagline': 'Antivirus plus password management and mobile protection for all your devices.', 'description': "Webroot Internet Security Plus builds on Webroot's fast cloud antivirus with extras for your digital life. It secures PCs, Macs, smartphones and tablets, adds a password manager to protect your logins, and removes traces of online activity to keep your browsing private.", 'features': ['Cloud antivirus for PC & Mac', 'Secures smartphones & tablets', 'Password manager', 'Eliminates online activity traces', 'Real-time anti-phishing', 'Lightning-fast scans'], 'variants': [{'devices': 1, 'years': 1, 'label': '1 Device / 1 Year', 'price': 44.99, 'original_price': 69.99}, {'devices': 3, 'years': 1, 'label': '3 Devices / 1 Year', 'price': 59.99, 'original_price': 89.99}], 'long_description': 'Webroot Internet Security Plus builds on the fast cloud antivirus with features that protect your whole digital life across PCs, Macs, smartphones and tablets.\n\nIt adds a password manager to secure your logins and tools that erase traces of your online activity for extra privacy. It is a good middle ground between basic antivirus and the full Complete suite.', 'source': 'seed'}, {'slug': 'webroot-internet-security-complete', 'name': 'Webroot Internet Security Complete', 'brand': 'Webroot', 'box_variant': 'green', 'category': 'Webroot Internet Security Complete', 'image_url': '', 'tagline': "Webroot's most complete protection with backup, privacy and a system optimizer.", 'description': 'Webroot Internet Security Complete is the full package: cloud-based antivirus, a password manager, mobile protection and a system optimizer that wipes away traces of online activity. It also includes secure cloud backup to keep your important files safe, all in one lightweight suite.', 'features': ['Complete antivirus protection', 'Password manager', 'System optimizer & cleanup', 'Secure cloud backup', 'Mobile device security', 'Privacy protection'], 'variants': [{'devices': 1, 'years': 1, 'label': '1 Device / 1 Year', 'price': 54.99, 'original_price': 89.99}, {'devices': 3, 'years': 1, 'label': '3 Devices / 1 Year', 'price': 64.99, 'original_price': 99.99}, {'devices': 5, 'years': 1, 'label': '5 Devices / 1 Year', 'price': 79.99, 'original_price': 129.99}], 'long_description': "Webroot Internet Security Complete is the top of the SecureAnywhere range, bundling everything into one lightweight package.\n\nYou get the cloud antivirus, password manager and mobile protection from Plus, plus a system optimizer that cleans online traces and secure cloud backup for your files. It stays fast and light thanks to Webroot's cloud design.", 'source': 'seed'}, {'slug': 'webroot-premium-identity', 'name': 'Webroot Premium with Identity Protection', 'brand': 'Webroot', 'box_variant': 'green', 'category': 'Webroot Premium', 'image_url': '', 'tagline': 'Webroot security plus identity protection and dark web monitoring.', 'description': 'Webroot Premium combines fast, cloud-based device security with identity protection. Along with antivirus, anti-phishing and a password manager for your devices, it monitors your identity and the dark web for your personal data and provides up to $1M in fraud expense reimbursement with 24/7 restoration support.', 'features': ['Cloud antivirus & anti-phishing', 'Identity monitoring', 'Dark web monitoring', 'Password manager', 'Up to $1M fraud reimbursement', '24/7 identity restoration'], 'variants': [{'devices': 5, 'years': 1, 'label': '5 Devices / 1 Year', 'price': 59.99, 'original_price': 99.99}], 'long_description': 'Webroot Premium pairs fast cloud-based security with identity protection, covering your devices and your personal information in one plan.\n\nYou get antivirus, anti-phishing and a password manager, plus identity and dark web monitoring. If your identity is compromised, you get up to $1M in fraud expense reimbursement and 24/7 restoration support.', 'source': 'seed'}]

DEFAULT_COUPONS = [
    {"code": "WELCOME10", "description": "10% off your first order", "discount_type": "percent", "discount_value": 10, "max_uses": 1000, "min_order": 0, "is_active": True},
    {"code": "SAVE20", "description": "$20 off orders over $80", "discount_type": "fixed", "discount_value": 20, "max_uses": 1000, "min_order": 80, "is_active": True},
]

DEFAULT_BANNER = {
    "id": "site-banner",
    "title": "Genuine license keys",
    "message": "Genuine antivirus license keys delivered by email - secure checkout and a 30-day money-back guarantee",
    "coupon_code": "",
    "expires_at": (datetime.now(timezone.utc) + timedelta(days=365)).isoformat(),
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
        # Upsert by slug: refresh seed products (incl. prices) without wiping
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
                await db.products.insert_one(product)
        # Deactivate stale seed products no longer in the catalog so they
        # do not render without images. Admin-added products are preserved.
        current_slugs = [p["slug"] for p in PRODUCTS]
        await db.products.update_many(
            {"slug": {"$nin": current_slugs}, "is_active": True, "source": {"$ne": "admin"}},
            {"$set": {"is_active": False}},
        )
        # Refresh the site banner to the clean default on reseed.
        await db.banner.update_one({"id": "site-banner"}, {"$set": DEFAULT_BANNER}, upsert=True)
        await db.meta.update_one({"key": "seed_version"}, {"$set": {"value": SEED_VERSION}}, upsert=True)
        logger.info(f"Reseeded {len(PRODUCTS)} products (version={SEED_VERSION})")

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

async def _ensure_indexes():
    try:
        await db.products.create_index([("is_active", 1), ("created_at", 1)])
        await db.products.create_index("slug", unique=False)
    except Exception as e:
        logger.warning(f"index ensure failed: {e}")

@app.on_event("startup")
async def startup():
    await seed_data()
    await _ensure_indexes()

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

# ---- product read cache (short TTL; invalidated on admin writes) ----
_PRODUCT_TTL = 60.0
_product_cache = {}

def _invalidate_products():
    _product_cache.clear()

def _cache_get(key):
    ent = _product_cache.get(key)
    if ent and (datetime.now(timezone.utc).timestamp() - ent[0]) < _PRODUCT_TTL:
        return ent[1]
    return None

def _cache_set(key, val):
    _product_cache[key] = (datetime.now(timezone.utc).timestamp(), val)

@api_router.get("/products", response_model=List[Product])
async def list_products(category: Optional[str] = None, brand: Optional[str] = None, featured: Optional[bool] = None):
    q = {"is_active": True}
    if category:
        q["category"] = category
    if brand:
        q["brand"] = brand
    if featured is not None:
        q["is_featured"] = featured
    key = ("list", category, brand, featured)
    cached = _cache_get(key)
    if cached is not None:
        return cached
    docs = await db.products.find(q, {"_id": 0, "description": 0, "long_description": 0}).sort("created_at", 1).to_list(200)
    res = [Product(**d) for d in docs]
    _cache_set(key, res)
    return res

@api_router.get("/products/{slug}", response_model=Product)
async def get_product(slug: str):
    key = ("one", slug)
    cached = _cache_get(key)
    if cached is not None:
        return cached
    doc = await db.products.find_one({"slug": slug, "is_active": True}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    res = Product(**doc)
    _cache_set(key, res)
    return res

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
    product.source = "admin"
    await db.products.insert_one(product.model_dump())
    _invalidate_products()
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
    _invalidate_products()
    return Product(**doc)

@api_router.delete("/admin/products/{product_id}")
async def admin_delete_product(product_id: str, admin_email: str = Depends(verify_admin)):
    await db.products.update_one({"id": product_id}, {"$set": {"is_active": False}})
    _invalidate_products()
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
    brand: Optional[str] = "Norton"

class ActivationRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_name: str
    customer_email: str
    customer_phone: Optional[str] = None
    product_key: str
    brand: str = "Norton"
    status: str = "pending"  # pending, activated, contacted
    admin_notes: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)

class ContactCreate(BaseModel):
    name: str
    email: str
    message: str

class ContactRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    message: str
    status: str = "pending"  # pending, responded
    created_at: str = Field(default_factory=now_iso)

def activation_admin_html(req: dict) -> str:
    phone_html = f"<p><strong>Phone:</strong> {req['customer_phone']}</p>" if req.get('customer_phone') else ""
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;padding:20px">
      <h2>New activation request received</h2>
      <p><strong>Name:</strong> {req['customer_name']}</p>
      <p><strong>Email:</strong> {req['customer_email']}</p>
      {phone_html}
      <p><strong>Brand:</strong> {req.get('brand', 'Norton')}</p>
      <p><strong>Product Key:</strong> <code style="background:#f3f4f6;padding:6px 8px;border-radius:4px;font-family:monospace">{req['product_key']}</code></p>
      <p><strong>Received:</strong> {req['created_at']}</p>
      <p>Please contact this customer to help complete their {req.get('brand', 'Norton')} activation.</p>
    </div>
    """

def activation_customer_html(req: dict) -> str:
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;padding:20px">
      <h2>Activation request received</h2>
      <p>Hi {req['customer_name']},</p>
      <p>We've received your {req.get('brand', 'Norton')} activation request. Our team will contact you within 12 hours to help complete the activation process.</p>
      <p><strong>Your product key:</strong> <code style="background:#f3f4f6;padding:6px 8px;border-radius:4px;font-family:monospace">{req['product_key']}</code></p>
      <p>If you have any questions, please reply to this email.</p>
      <p>Best regards,<br/>{STORE_NAME} Team</p>
    </div>
    """

def contact_admin_html(req: dict) -> str:
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;padding:20px">
      <h2>New contact form submission</h2>
      <p><strong>Name:</strong> {req['name']}</p>
      <p><strong>Email:</strong> {req['email']}</p>
      <p><strong>Message:</strong></p>
      <div style="background:#f9f9f9;padding:15px;border-left:4px solid #FFC220;margin:10px 0">
        {req['message'].replace('\n', '<br/>')}
      </div>
      <p><strong>Received:</strong> {req['created_at']}</p>
      <p>Please respond to this customer inquiry.</p>
    </div>
    """

def contact_customer_html(req: dict) -> str:
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;padding:20px">
      <h2>Message received</h2>
      <p>Hi {req['name']},</p>
      <p>Thank you for contacting {STORE_NAME}. We've received your message and will respond within 12 hours.</p>
      <p><strong>Your message:</strong></p>
      <div style="background:#f9f9f9;padding:15px;border-left:4px solid #FFC220;margin:10px 0">
        {req['message'].replace('\n', '<br/>')}
      </div>
      <p>If you have any urgent questions, please email us at info@buyinstantkeys.com</p>
      <p>Best regards,<br/>{STORE_NAME} Team</p>
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
        brand=(body.brand or "Norton").strip(),
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

@api_router.post("/contact", response_model=ContactRequest)
async def create_contact(body: ContactCreate):
    if not body.message.strip():
        raise HTTPException(status_code=400, detail="Message is required")
    req = ContactRequest(
        name=body.name.strip(),
        email=body.email.lower(),
        message=body.message.strip(),
    )
    await db.contacts.insert_one(req.model_dump())
    doc = req.model_dump()
    # Notify admin team (primary: info@buyinstantkeys.com)
    await send_email(
        to="info@buyinstantkeys.com",
        subject=f"[Contact] {req.name} — {req.email}",
        html=contact_admin_html(doc),
    )
    # Confirmation to the customer
    await send_email(
        to=req.email,
        subject=f"Message received — {STORE_NAME}",
        html=contact_customer_html(doc),
    )
    return req

@api_router.get("/admin/contacts", response_model=List[ContactRequest])
async def admin_list_contacts(status: Optional[str] = None, admin_email: str = Depends(verify_admin)):
    q = {}
    if status:
        q["status"] = status
    docs = await db.contacts.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [ContactRequest(**d) for d in docs]

@api_router.patch("/admin/activations/{req_id}")
async def admin_update_activation(req_id: str, body: dict, admin_email: str = Depends(verify_admin)):
    upd = {k: v for k, v in body.items() if v is not None and k in ("status", "admin_notes")}
    await db.activations.update_one({"id": req_id}, {"$set": upd})
    doc = await db.activations.find_one({"id": req_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    return doc

@api_router.get("/google-merchant-feed")
async def google_merchant_feed():
    """Generate Google Merchant Center XML feed for all active products"""
    products = await db.products.find({"is_active": True}, {"_id": 0}).to_list(200)
    
    # Create XML structure
    rss = Element("rss", {
        "version": "2.0",
        "xmlns:g": "http://base.google.com/ns/1.0"
    })
    channel = SubElement(rss, "channel")
    
    # Channel elements
    SubElement(channel, "title").text = STORE_NAME
    SubElement(channel, "link").text = STORE_URL
    SubElement(channel, "description").text = f"Genuine antivirus license keys with fast email delivery from {STORE_NAME}."
    
    for product in products:
        # Get the lowest price variant as the main product
        if product.get("variants"):
            lowest_variant = min(product["variants"], key=lambda x: x["price"])
        else:
            continue
            
        item = SubElement(channel, "item")
        
        # Required fields
        SubElement(item, "g:id").text = product["id"]
        SubElement(item, "g:title").text = product["name"]
        SubElement(item, "g:description").text = product["description"]
        SubElement(item, "g:link").text = f"{STORE_URL}/products/{product['slug']}"
        SubElement(item, "g:image_link").text = f"{STORE_URL}/images/products/{product['slug']}.jpg" if product.get("image_url") else f"{STORE_URL}/images/norton-default.jpg"
        SubElement(item, "g:price").text = f"{lowest_variant['price']} USD"
        SubElement(item, "g:availability").text = "in stock"
        SubElement(item, "g:condition").text = "new"
        SubElement(item, "g:brand").text = "Norton"
        
        # Optional but recommended fields
        SubElement(item, "g:product_type").text = f"Software > Antivirus & Security > {product['category']}"
        SubElement(item, "g:mpn").text = product["id"]
        
        # Add all variants as separate items with different prices
        for variant in product["variants"]:
            variant_item = SubElement(channel, "item")
            SubElement(variant_item, "g:id").text = f"{product['id']}-{variant['id']}"
            SubElement(variant_item, "g:title").text = f"{product['name']} - {variant['label']}"
            SubElement(variant_item, "g:description").text = product["description"]
            SubElement(variant_item, "g:link").text = f"{STORE_URL}/products/{product['slug']}"
            SubElement(variant_item, "g:image_link").text = f"{STORE_URL}/images/products/{product['slug']}.jpg" if product.get("image_url") else f"{STORE_URL}/images/norton-default.jpg"
            SubElement(variant_item, "g:price").text = f"{variant['price']} USD"
            if variant.get("original_price"):
                SubElement(variant_item, "g:sale_price").text = f"{variant['price']} USD"
            SubElement(variant_item, "g:availability").text = "in stock"
            SubElement(variant_item, "g:condition").text = "new"
            SubElement(variant_item, "g:brand").text = "Norton"
            SubElement(variant_item, "g:product_type").text = f"Software > Antivirus & Security > {product['category']}"
            SubElement(variant_item, "g:mpn").text = f"{product['id']}-{variant['id']}"
    
    # Generate XML string
    xml_str = tostring(rss, encoding="unicode")
    
    return Response(
        content=xml_str,
        media_type="application/xml",
        headers={"Content-Disposition": "attachment; filename=google_merchant_feed.xml"}
    )

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
    
    # Catch-all route for SPA routing - will only be reached if no API route matches
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        logger.info(f"SPA route requested: {full_path}")
        
        # Check if the requested file exists in the build directory
        requested_file = FRONTEND_BUILD / full_path
        if requested_file.exists() and requested_file.is_file():
            logger.info(f"Serving file: {requested_file}")
            return FileResponse(str(requested_file))
        
        # For all other routes, serve index.html for SPA routing
        index_file = FRONTEND_BUILD / "index.html"
        if index_file.exists():
            logger.info(f"Serving index.html for route: {full_path}")
            return FileResponse(str(index_file))
        
        logger.error(f"Frontend not built at {FRONTEND_BUILD}")
        raise HTTPException(status_code=404, detail="Frontend not built. Run 'npm run build' in frontend directory.")
    
    logger.info(f"SPA routing enabled for frontend build at {FRONTEND_BUILD}")
else:
    logger.warning(f"Frontend build directory not found at {FRONTEND_BUILD}. SPA routing disabled.")

app.add_middleware(GZipMiddleware, minimum_size=1000)
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
