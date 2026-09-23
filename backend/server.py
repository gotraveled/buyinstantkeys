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
    platforms: List[str] = ["windows", "macos", "android", "ios"]
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
    platforms: List[str] = ["windows", "macos", "android", "ios"]

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
    platforms: Optional[List[str]] = None

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
SEED_VERSION = "2026-09-v14-official-content"

PRODUCTS = [{'slug': 'norton-360-deluxe',
  'name': 'Norton 360 Deluxe',
  'brand': 'Norton',
  'box_variant': 'gold',
  'category': 'Norton 360',
  'image_url': '',
  'tagline': 'All-in-one protection for up to 5 devices with VPN, Dark Web Monitoring, Parental Control and 50 GB '
             'cloud backup.',
  'description': 'Norton 360 Deluxe layers real-time antivirus, anti-ransomware and anti-phishing defense over your '
                 'PCs, Macs, phones and tablets. A built-in Secure VPN keeps your connection private on public Wi-Fi, '
                 'while Dark Web Monitoring watches for your personal data, Parental Controls help you manage what '
                 'your kids see online, and 50 GB of cloud backup keeps important files safe.',
  'features': ['Real-time malware & ransomware protection',
               'AI-powered Scam Protection',
               'Deepfake Protection',
               'Secure VPN (5 devices)',
               'Dark Web Monitoring',
               '50 GB cloud backup',
               'Password Manager',
               'Parental Controls',
               '100% Virus Protection Promise'],
  'variants': [{'devices': 3, 'years': 1, 'label': '3 Devices / 1 Year', 'price': 54.99, 'original_price': 99.99},
               {'devices': 5, 'years': 1, 'label': '5 Devices / 1 Year', 'price': 74.99, 'original_price': 119.99}],
  'long_description': 'Norton 360 Deluxe covers the whole household under one subscription, wrapping real-time '
                      'antivirus, anti-ransomware and anti-phishing defense around up to five PCs, Macs, phones and '
                      'tablets.\n'
                      '\n'
                      'It adds a Secure VPN for public Wi-Fi, Dark Web Monitoring for your personal data, a Password '
                      'Manager, Parental Controls and 50 GB of cloud backup. Newer capabilities include AI-powered '
                      'Scam Protection to help block scam texts and calls, and Deepfake Protection to help detect '
                      'AI-generated scam videos.',
  'source': 'seed',
  'is_featured': True,
  'platforms': ['windows', 'macos', 'android', 'ios']},
 {'slug': 'norton-360-deluxe-lifelock',
  'name': 'Norton 360 with LifeLock Select',
  'brand': 'Norton',
  'box_variant': 'gold',
  'category': 'Norton 360 LifeLock',
  'image_url': '',
  'tagline': 'Device security plus LifeLock identity theft protection, credit monitoring and $1 million coverage for 5 '
             'devices.',
  'description': 'Norton 360 with LifeLock Select combines Norton 360 Deluxe device security with LifeLock identity '
                 'theft protection. It monitors your identity, alerts you to suspicious activity, and provides up to '
                 '$1 million in stolen funds reimbursement for qualifying losses.',
  'features': ['Real-time malware & ransomware protection',
               'AI-powered Scam Protection',
               'Deepfake Protection',
               'Secure VPN (5 devices)',
               'Dark Web Monitoring',
               '50 GB cloud backup',
               'Password Manager',
               'Parental Controls',
               'LifeLock identity theft protection',
               'Credit monitoring (one bureau)',
               '$1 million stolen funds reimbursement*',
               '100% Virus Protection Promise'],
  'variants': [{'devices': 5, 'years': 1, 'label': '5 Devices / 1 Year', 'price': 99.99, 'original_price': 149.99}],
  'long_description': 'Norton 360 with LifeLock Select pairs the full device security of Norton 360 Deluxe with '
                      'LifeLock identity theft protection. It covers up to five PCs, Macs, phones and tablets and '
                      'monitors your identity for misuse.\n'
                      '\n'
                      'You get Dark Web Monitoring, credit monitoring from one bureau, alerts for suspicious activity, '
                      'and up to $1 million in stolen funds reimbursement for qualifying identity theft losses. It is '
                      'the right choice when you want both cybersecurity and basic identity protection in one '
                      'subscription.',
  'source': 'seed',
  'is_featured': False,
  'platforms': ['windows', 'macos', 'android', 'ios']},
 {'slug': 'norton-360-premium',
  'name': 'Norton 360 Premium',
  'brand': 'Norton',
  'box_variant': 'gold',
  'category': 'Norton 360',
  'image_url': '',
  'tagline': 'Family-sized protection for up to 10 devices with 100 GB cloud backup and premium privacy features.',
  'description': 'Norton 360 Premium protects up to 10 devices with the same Deluxe-level security plus 100 GB of '
                 'cloud backup, giving larger households more room to protect photos, documents and other important '
                 'files.',
  'features': ['Real-time malware & ransomware protection',
               'AI-powered Scam Protection',
               'Deepfake Protection',
               'Secure VPN (10 devices)',
               'Dark Web Monitoring',
               '100 GB cloud backup',
               'Password Manager',
               'Parental Controls',
               '100% Virus Protection Promise'],
  'variants': [{'devices': 10, 'years': 1, 'label': '10 Devices / 1 Year', 'price': 99.99, 'original_price': 149.99}],
  'long_description': 'Norton 360 Premium is built for larger families and households with many devices. It protects '
                      'up to 10 PCs, Macs, smartphones or tablets with real-time antivirus, anti-ransomware and '
                      'anti-phishing, plus a Secure VPN, Dark Web Monitoring, Password Manager and Parental Controls.\n'
                      '\n'
                      'The Premium tier doubles the cloud backup allowance to 100 GB and supports up to 10 '
                      'simultaneous VPN connections, so everyone can browse privately at the same time.',
  'source': 'seed',
  'is_featured': True,
  'platforms': ['windows', 'macos', 'android', 'ios']},
 {'slug': 'norton-360-standard',
  'name': 'Norton 360 Standard',
  'brand': 'Norton',
  'box_variant': 'gold',
  'category': 'Norton 360',
  'image_url': '',
  'tagline': 'Essential all-in-one protection with VPN, Dark Web Monitoring and 10 GB cloud backup for 3 devices.',
  'description': 'Norton 360 Standard covers up to 3 devices with real-time antivirus, a Secure VPN for private '
                 'browsing, Dark Web Monitoring, a Password Manager and 10 GB of cloud backup.',
  'features': ['Real-time antivirus, malware & ransomware protection',
               'AI-powered Scam Protection',
               'Deepfake Protection',
               'Secure VPN (3 devices)',
               'Dark Web Monitoring',
               '10 GB cloud backup',
               'Password Manager',
               '100% Virus Protection Promise'],
  'variants': [{'devices': 1, 'years': 1, 'label': '1 Device / 1 Year', 'price': 49.99, 'original_price': 94.99}],
  'long_description': "Norton 360 Standard is the most accessible way into Norton's all-in-one security lineup. It "
                      'protects up to 3 PCs, Macs, smartphones or tablets with real-time antivirus, anti-malware and '
                      'anti-ransomware technology.\n'
                      '\n'
                      'You also get a Secure VPN, Dark Web Monitoring that alerts you if your personal data appears on '
                      'the dark web, a Password Manager and 10 GB of cloud backup. AI-powered Scam Protection and '
                      "Deepfake Protection help keep you safer from today's most advanced online scams.",
  'source': 'seed',
  'is_featured': False,
  'platforms': ['windows', 'macos', 'android', 'ios']},
 {'slug': 'norton-secure-vpn',
  'name': 'Norton Secure VPN',
  'brand': 'Norton',
  'box_variant': 'gold',
  'category': 'Norton VPN',
  'image_url': '',
  'tagline': 'Bank-grade VPN that encrypts your connection and hides your IP on Windows, Mac, Android and iOS.',
  'description': 'Norton Secure VPN masks your IP address and encrypts your internet traffic with bank-grade '
                 'encryption, helping keep your online activity private on public Wi-Fi and at home.',
  'features': ['Bank-grade AES-256 encryption',
               'No-log VPN policy',
               'Automatic protection on unsafe Wi-Fi',
               'Multiple virtual server locations',
               'Ad tracker blocking',
               'Works on PC, Mac, Android and iOS'],
  'variants': [{'devices': 5, 'years': 1, 'label': '5 Devices / 1 Year', 'price': 54.99, 'original_price': 79.99}],
  'long_description': 'Norton Secure VPN is a no-logs virtual private network that encrypts your internet connection '
                      'and hides your IP address. It automatically protects you on public Wi-Fi hotspots and lets you '
                      'choose from multiple virtual locations for more private browsing, streaming and banking.\n'
                      '\n'
                      'The plan covers up to five devices across Windows, macOS, Android and iOS, and helps block ad '
                      'trackers that follow you around the web.',
  'source': 'seed',
  'is_featured': False,
  'platforms': ['windows', 'macos', 'android', 'ios']},
 {'slug': 'norton-small-business',
  'name': 'Norton Small Business',
  'brand': 'Norton',
  'box_variant': 'gold',
  'category': 'Norton Small Business',
  'image_url': '',
  'tagline': 'Centralized cybersecurity for small businesses covering up to 10 devices.',
  'description': 'Norton Small Business Premium provides business-grade antivirus, VPN, a centralized management '
                 'console and protection for up to 10 PCs, Macs, smartphones or tablets.',
  'features': ['Business-grade antivirus & anti-malware',
               'Secure VPN for employees',
               'Centralized management console',
               'Protection for up to 10 devices',
               'Email and web protection',
               'Cloud backup for business files'],
  'variants': [{'devices': 10, 'years': 1, 'label': '10 Devices / 1 Year', 'price': 99.99, 'original_price': 149.99}],
  'long_description': 'Norton Small Business Premium is designed for small companies that need easy-to-deploy, '
                      'centralized security. It protects up to 10 business devices with antivirus, anti-malware, a '
                      'secure VPN and a cloud-based management console that lets you monitor and manage protection '
                      'from anywhere.\n'
                      '\n'
                      'Email and web protection help block phishing and malicious websites, while backup options keep '
                      'important business files safer from ransomware or hardware failure.',
  'source': 'seed',
  'is_featured': False,
  'platforms': ['windows', 'macos', 'android', 'ios']},
 {'slug': 'norton-utilities-ultimate',
  'name': 'Norton Utilities Ultimate',
  'brand': 'Norton',
  'box_variant': 'gold',
  'category': 'Norton Utilities',
  'image_url': '',
  'tagline': 'Speed up, clean up and tune up to 10 Windows PCs with one subscription.',
  'description': 'Norton Utilities Ultimate removes junk files, fixes registry issues, frees up disk space and helps '
                 'keep up to 10 Windows PCs running smoothly.',
  'features': ['Junk file & registry cleanup',
               'Startup program optimizer',
               'File shredder for secure deletion',
               'Privacy trace cleaner',
               'Real-time performance monitoring',
               'Covers up to 10 Windows PCs'],
  'variants': [{'devices': 10, 'years': 1, 'label': '10 PCs / 1 Year', 'price': 69.99, 'original_price': 99.99}],
  'long_description': 'Norton Utilities Ultimate is a PC optimization suite that helps improve boot times, free disk '
                      'space and fix common Windows performance issues. It cleans junk files, repairs registry '
                      'entries, removes browser traces and lets you securely shred sensitive files.\n'
                      '\n'
                      'With coverage for up to 10 Windows PCs, it is ideal for home offices and families who want to '
                      'keep older computers running like new.',
  'source': 'seed',
  'is_featured': False,
  'platforms': ['windows']},
 {'slug': 'mcafee-antivirus',
  'name': 'McAfee AntiVirus',
  'brand': 'McAfee',
  'box_variant': 'red',
  'category': 'McAfee AntiVirus',
  'image_url': '',
  'tagline': 'Award-winning antivirus protection for a single Windows PC with automatic updates.',
  'description': 'McAfee AntiVirus provides essential, lightweight protection for one Windows PC, defending against '
                 'viruses, malware, ransomware and phishing with real-time threat detection.',
  'features': ['Real-time antivirus & malware protection',
               'Anti-phishing web protection',
               'Lightweight background performance',
               'Automatic threat intelligence updates',
               'McAfee Virus Protection Pledge*'],
  'variants': [{'devices': 1, 'years': 1, 'label': '1 PC / 1 Year', 'price': 39.99, 'original_price': 59.99},
               {'devices': 1, 'years': 3, 'label': '1 PC / 3 Years', 'price': 79.99, 'original_price': 119.99}],
  'long_description': 'McAfee AntiVirus is a straightforward, reliable solution for protecting one Windows PC. It '
                      'delivers real-time detection and blocking of viruses, malware, ransomware and phishing attacks '
                      'without slowing your computer down.\n'
                      '\n'
                      "Automatic updates keep your protection current, and McAfee's Virus Protection Pledge means "
                      'experts will help remove viruses or your money back (with auto-renewal enrollment).',
  'source': 'seed',
  'is_featured': False,
  'platforms': ['windows']},
 {'slug': 'mcafee-internet-security',
  'name': 'McAfee Internet Security',
  'brand': 'McAfee',
  'box_variant': 'red',
  'category': 'McAfee Internet Security',
  'image_url': '',
  'tagline': 'Multi-device security with firewall, VPN, identity monitoring and award-winning antivirus.',
  'description': 'McAfee Internet Security protects your devices with real-time antivirus, a smart firewall, a Secure '
                 'VPN, identity monitoring and safe web browsing tools.',
  'features': ['Real-time antivirus & malware protection',
               'Advanced firewall',
               'Secure VPN',
               'Anti-phishing web protection',
               'Identity monitoring alerts',
               'Password Manager',
               'Cross-device protection'],
  'variants': [{'devices': 1, 'years': 1, 'label': '1 Device / 1 Year', 'price': 39.99, 'original_price': 59.99},
               {'devices': 3, 'years': 1, 'label': '3 Devices / 1 Year', 'price': 49.99, 'original_price': 79.99},
               {'devices': 5, 'years': 1, 'label': '5 Devices / 1 Year', 'price': 59.99, 'original_price': 99.99},
               {'devices': 10, 'years': 1, 'label': '10 Devices / 1 Year', 'price': 69.99, 'original_price': 119.99}],
  'long_description': 'McAfee Internet Security provides comprehensive online protection for multiple devices. It '
                      'combines real-time antivirus with an advanced firewall, a Secure VPN, anti-phishing web '
                      'protection and identity monitoring alerts.\n'
                      '\n'
                      'A built-in Password Manager helps you create and store strong credentials, while cross-device '
                      'protection extends coverage to your PCs, Macs, Android and iOS devices.',
  'source': 'seed',
  'is_featured': True,
  'platforms': ['windows', 'macos', 'android', 'ios']},
 {'slug': 'mcafee-mobile-security',
  'name': 'McAfee Mobile Security',
  'brand': 'McAfee',
  'box_variant': 'red',
  'category': 'McAfee Mobile Security',
  'image_url': '',
  'tagline': 'Antivirus, anti-theft and privacy protection for Android and iOS devices.',
  'description': 'McAfee Mobile Security keeps your smartphone or tablet safe with antivirus, anti-theft tools, Wi-Fi '
                 'protection and privacy features designed for life on the go.',
  'features': ['Mobile antivirus & malware protection',
               'Anti-theft protection (Android)',
               'Secure Wi-Fi scanning',
               'App privacy review',
               'Anti-phishing web protection'],
  'variants': [{'devices': 1, 'years': 1, 'label': '1 Device / 1 Year', 'price': 29.99, 'original_price': 44.99},
               {'devices': 10, 'years': 1, 'label': '10 Devices / 1 Year', 'price': 49.99, 'original_price': 89.99}],
  'long_description': 'McAfee Mobile Security is designed for Android and iOS smartphones and tablets. It blocks '
                      'mobile malware, reviews app permissions for privacy risks, warns you about unsafe Wi-Fi '
                      'networks and helps protect against phishing links.\n'
                      '\n'
                      'Android users also get anti-theft tools that can locate, lock or wipe a lost device. It is the '
                      'right plan when your phone is your primary gateway to the internet.',
  'source': 'seed',
  'is_featured': False,
  'platforms': ['android', 'ios']},
 {'slug': 'mcafee-total-protection',
  'name': 'McAfee Total Protection',
  'brand': 'McAfee',
  'box_variant': 'red',
  'category': 'McAfee Total Protection',
  'image_url': '',
  'tagline': 'All-in-one antivirus, privacy and identity protection for your whole household.',
  'description': 'McAfee Total Protection delivers premium antivirus, a Secure VPN, identity monitoring, a Password '
                 'Manager and safe browsing for multiple devices under one subscription.',
  'features': ['Premium antivirus & ransomware protection',
               'Scam protection & deepfake scam defense',
               'Secure VPN',
               'Identity monitoring alerts',
               'Password Manager',
               'Safe web browsing & web protection',
               'File shredder & tracker remover',
               'Cross-device coverage'],
  'variants': [{'devices': 1, 'years': 1, 'label': '1 Device / 1 Year', 'price': 44.99, 'original_price': 84.99},
               {'devices': 5, 'years': 1, 'label': '5 Devices / 1 Year', 'price': 59.99, 'original_price': 119.99},
               {'devices': 10, 'years': 1, 'label': '10 Devices / 1 Year', 'price': 74.99, 'original_price': 159.99}],
  'long_description': 'McAfee Total Protection is an all-in-one security suite that helps keep your devices, privacy '
                      'and identity safer. It includes premium antivirus, scam protection, a Secure VPN, identity '
                      'monitoring alerts and a Password Manager.\n'
                      '\n'
                      'Safe web browsing warns you about risky sites and downloads, while a file shredder and tracker '
                      'remover help you clean up digital clutter. It is a solid choice for households that want '
                      'broader protection without the higher tiers.',
  'source': 'seed',
  'is_featured': True,
  'platforms': ['windows', 'macos', 'android', 'ios']},
 {'slug': 'webroot-secureanywhere-antivirus',
  'name': 'Webroot SecureAnywhere AntiVirus',
  'brand': 'Webroot',
  'box_variant': 'green',
  'category': 'Webroot SecureAnywhere',
  'image_url': '',
  'tagline': 'Lightning-fast cloud antivirus that protects PCs and Macs without slowing them down.',
  'description': 'Webroot SecureAnywhere AntiVirus uses cloud-based technology to deliver real-time protection against '
                 'viruses, malware, phishing and ransomware in a tiny, fast package.',
  'features': ['Real-time cloud-based antivirus',
               'Anti-phishing & web threat shield',
               'Firewall & network monitor',
               'Text scam detection',
               'Breach monitor',
               'Always-on protection without large updates',
               'Lightning-fast scans'],
  'variants': [{'devices': 1, 'years': 1, 'label': '1 Device / 1 Year', 'price': 39.99, 'original_price': 49.99},
               {'devices': 3, 'years': 1, 'label': '3 Devices / 1 Year', 'price': 54.99, 'original_price': 69.99}],
  'long_description': 'Webroot SecureAnywhere AntiVirus is a cloud-powered antivirus for Windows and Mac that installs '
                      'in seconds and scans in minutes. It uses real-time threat intelligence to block viruses, '
                      'malware, phishing and ransomware before they can harm your device.\n'
                      '\n'
                      'New features include text scam detection and a breach monitor that alerts you when your '
                      'information appears in known data leaks.',
  'source': 'seed',
  'is_featured': True,
  'platforms': ['windows', 'macos']},
 {'slug': 'webroot-internet-security-plus',
  'name': 'Webroot Internet Security Plus',
  'brand': 'Webroot',
  'box_variant': 'green',
  'category': 'Webroot Internet Security Plus',
  'image_url': '',
  'tagline': 'Multi-device antivirus plus a Secure VPN and password manager for your household.',
  'description': "Webroot Internet Security Plus extends Webroot's fast cloud antivirus to all your devices and adds a "
                 'Secure VPN, password manager and system optimizer tools.',
  'features': ['Cloud antivirus for PCs, Macs, phones & tablets',
               'Secure VPN',
               'Password manager',
               'System optimizer',
               'Anti-phishing web shield',
               'Text scam detection & breach monitor',
               'Cross-device protection'],
  'variants': [{'devices': 1, 'years': 1, 'label': '1 Device / 1 Year', 'price': 49.99, 'original_price': 69.99},
               {'devices': 3, 'years': 1, 'label': '3 Devices / 1 Year', 'price': 64.99, 'original_price': 89.99}],
  'long_description': 'Webroot Internet Security Plus covers multiple PCs, Macs, smartphones and tablets with '
                      'cloud-based antivirus that never bogs down your system. It adds a Secure VPN for private '
                      'browsing, a password manager and tools to optimize system performance.\n'
                      '\n'
                      'It also includes anti-phishing protection, text scam detection and a breach monitor so you can '
                      'act quickly if your data is exposed.',
  'source': 'seed',
  'is_featured': False,
  'platforms': ['windows', 'macos', 'android', 'ios']},
 {'slug': 'webroot-internet-security-complete',
  'name': 'Webroot Internet Security Complete',
  'brand': 'Webroot',
  'box_variant': 'green',
  'category': 'Webroot Internet Security Complete',
  'image_url': '',
  'tagline': 'Complete multi-device security with cloud backup, identity shield and system cleanup tools.',
  'description': 'Webroot Internet Security Complete adds secure cloud backup, Identity Shield and advanced system '
                 "cleanup to Webroot's fast, cloud-based antivirus protection.",
  'features': ['Cloud antivirus for multiple devices',
               '25 GB secure cloud backup',
               'Identity Shield for banking & shopping',
               'System optimizer & cleanup',
               'Secure VPN & password manager',
               'Anti-phishing web shield',
               'Text scam detection & breach monitor'],
  'variants': [{'devices': 1, 'years': 1, 'label': '1 Device / 1 Year', 'price': 59.99, 'original_price': 89.99},
               {'devices': 3, 'years': 1, 'label': '3 Devices / 1 Year', 'price': 74.99, 'original_price': 109.99},
               {'devices': 5, 'years': 1, 'label': '5 Devices / 1 Year', 'price': 89.99, 'original_price': 129.99}],
  'long_description': "Webroot Internet Security Complete is Webroot's most comprehensive traditional security suite. "
                      'It protects multiple devices with cloud-based antivirus and adds 25 GB of secure cloud backup, '
                      'Identity Shield to help protect banking and shopping transactions, and system cleanup tools.\n'
                      '\n'
                      'You also get a Secure VPN, password manager, anti-phishing web shield, text scam detection and '
                      'a breach monitor.',
  'source': 'seed',
  'is_featured': True,
  'platforms': ['windows', 'macos', 'android', 'ios']},
 {'slug': 'webroot-premium-identity',
  'name': 'Webroot Premium with Identity Protection',
  'brand': 'Webroot',
  'box_variant': 'green',
  'category': 'Webroot Premium',
  'image_url': '',
  'tagline': 'Advanced antivirus plus Allstate-powered identity protection, credit monitoring and $1M reimbursement.',
  'description': 'Webroot Premium combines fast cloud antivirus with identity protection powered by Allstate Identity '
                 'Protection, including dark web monitoring, credit alerts and up to $1 million in identity theft '
                 'expense reimbursement.',
  'features': ['Cloud antivirus for multiple devices',
               'Identity monitoring & dark web alerts',
               'Credit monitoring & alerts',
               '$1 million identity theft expense reimbursement*',
               'Secure VPN & password manager',
               '24/7 US-based identity restoration',
               'Text scam detection & breach monitor'],
  'variants': [{'devices': 5, 'years': 1, 'label': '5 Devices / 1 Year', 'price': 99.99, 'original_price': 129.99}],
  'long_description': "Webroot Premium pairs Webroot's fast, cloud-based antivirus with identity protection backed by "
                      'Allstate Identity Protection. It monitors the dark web and your credit for signs of identity '
                      'misuse and provides up to $1 million in identity theft expense reimbursement.\n'
                      '\n'
                      'US-based restoration experts are available 24/7 to help you recover if your identity is '
                      'compromised. It also includes a Secure VPN, password manager and text scam detection.',
  'source': 'seed',
  'is_featured': False,
  'platforms': ['windows', 'macos', 'android', 'ios']},
 {'slug': 'norton-antivirus-plus',
  'name': 'Norton AntiVirus Plus',
  'brand': 'Norton',
  'box_variant': 'gold',
  'category': 'Norton Antivirus',
  'image_url': '',
  'tagline': 'Award-winning antivirus, AI Scam Protection and a Password Manager for 1 PC, Mac or mobile device.',
  'description': 'Norton AntiVirus Plus delivers powerful antivirus and anti-malware protection for one device. It '
                 'includes AI-powered Scam Protection to help stop advanced scams, a Smart Firewall for PC, a Password '
                 'Manager and 2 GB of cloud backup.',
  'features': ['Real-time antivirus, malware & ransomware protection',
               'AI-powered Scam Protection',
               'Deepfake Protection',
               'Smart Firewall for PC / Firewall for Mac',
               'Password Manager',
               '2 GB cloud backup',
               '100% Virus Protection Promise'],
  'variants': [{'devices': 1, 'years': 1, 'label': '1 PC / 1 Year', 'price': 34.99, 'original_price': 59.99},
               {'devices': 1, 'years': 2, 'label': '1 PC / 2 Years', 'price': 54.99, 'original_price': 99.99}],
  'long_description': 'Norton AntiVirus Plus is the ideal entry-level plan for users who want trusted, award-winning '
                      'antivirus without the full 360 suite. It protects one PC, Mac, smartphone or tablet with '
                      'real-time malware and ransomware defense.\n'
                      '\n'
                      'It also includes AI-powered Scam Protection to help detect scams online and in texts, Deepfake '
                      'Protection, a Smart Firewall for PC, a Password Manager and 2 GB of cloud backup for Windows. '
                      "Norton's 100% Virus Protection Promise adds extra confidence: if a virus ever gets through, "
                      'experts will help remove it or you get a refund.*',
  'platforms': ['windows', 'macos', 'android', 'ios'],
  'is_featured': False},
 {'slug': 'norton-360-gamers',
  'name': 'Norton 360 for Gamers',
  'brand': 'Norton',
  'box_variant': 'gold',
  'category': 'Norton 360',
  'image_url': '',
  'tagline': 'Security designed for PC gamers with Game Booster, fewer notifications and full Norton 360 protection '
             'for 3 devices.',
  'description': 'Norton 360 for Gamers delivers the same powerful device security as Norton 360 Deluxe, plus Game '
                 'Booster that optimizes PC performance and suppresses non-critical notifications while you play.',
  'features': ['Game Booster for PC gaming',
               'Real-time malware & ransomware protection',
               'AI-powered Scam Protection',
               'Deepfake Protection',
               'Secure VPN (3 devices)',
               'Dark Web Monitoring',
               '50 GB cloud backup',
               'Password Manager',
               '100% Virus Protection Promise'],
  'variants': [{'devices': 3, 'years': 1, 'label': '3 Devices / 1 Year', 'price': 49.99, 'original_price': 79.99}],
  'long_description': 'Norton 360 for Gamers is built for players who want protection without interruptions. It '
                      'includes the same real-time antivirus, Secure VPN, Dark Web Monitoring, Password Manager and 50 '
                      'GB cloud backup as Norton 360 Deluxe.\n'
                      '\n'
                      'The difference is Game Booster, which helps improve PC performance while gaming and suppresses '
                      'non-critical security notifications so they do not pull you out of the action. It covers up to '
                      'three devices.',
  'platforms': ['windows', 'macos', 'android', 'ios'],
  'is_featured': False},
 {'slug': 'webroot-mobile-security',
  'name': 'Webroot Mobile Security',
  'brand': 'Webroot',
  'box_variant': 'green',
  'category': 'Webroot Mobile',
  'image_url': '',
  'tagline': 'Lightweight protection for Android and iOS smartphones and tablets.',
  'description': 'Webroot Mobile Security keeps your phone or tablet safe from malicious apps, phishing links and '
                 'risky Wi-Fi without draining battery or slowing performance.',
  'features': ['App inspection & malware blocking',
               'Anti-phishing web shield',
               'Secure browsing on mobile',
               'Anti-theft features (Android)',
               'Lightweight, battery-friendly design'],
  'variants': [{'devices': 1, 'years': 1, 'label': '1 Device / 1 Year', 'price': 19.99, 'original_price': 29.99},
               {'devices': 3, 'years': 1, 'label': '3 Devices / 1 Year', 'price': 34.99, 'original_price': 49.99}],
  'long_description': 'Webroot Mobile Security is a lightweight, cloud-based solution for Android and iOS devices. It '
                      'scans apps and links in real time, blocks phishing sites and keeps your mobile identity safer '
                      'without draining battery life.\n'
                      '\n'
                      'The Android version adds anti-theft tools such as remote lock and wipe. Whether you use one '
                      'phone or several family devices, this plan is designed to stay fast and unobtrusive.',
  'platforms': ['android', 'ios'],
  'is_featured': False},
 {'slug': 'webroot-wifi-security-vpn',
  'name': 'Webroot WiFi Security VPN',
  'brand': 'Webroot',
  'box_variant': 'green',
  'category': 'Webroot VPN',
  'image_url': '',
  'tagline': 'Encrypt your connection and browse privately on any network.',
  'description': 'Webroot WiFi Security VPN masks your IP address and encrypts your internet traffic so you can use '
                 'public Wi-Fi, stream and browse without exposing your data.',
  'features': ['Bank-grade AES-256 encryption',
               'No-logs VPN policy',
               'Multiple virtual server locations',
               'Automatic protection on unsafe Wi-Fi',
               'Works on PC, Mac, Android and iOS'],
  'variants': [{'devices': 3, 'years': 1, 'label': '3 Devices / 1 Year', 'price': 34.99, 'original_price': 59.99},
               {'devices': 5, 'years': 1, 'label': '5 Devices / 1 Year', 'price': 49.99, 'original_price': 79.99}],
  'long_description': 'Webroot WiFi Security VPN is a no-logs virtual private network that protects your connection on '
                      'public Wi-Fi, at coffee shops, airports and hotels. It encrypts traffic with AES-256 and lets '
                      'you choose from multiple virtual locations.\n'
                      '\n'
                      'You can protect up to five devices under one subscription across Windows, macOS, Android and '
                      'iOS. It is a simple way to add privacy and avoid tracking without slowing down your connection.',
  'platforms': ['windows', 'macos', 'android', 'ios'],
  'is_featured': False},
 {'slug': 'mcafee-plus-essential',
  'name': 'McAfee+ Essential',
  'brand': 'McAfee',
  'box_variant': 'red',
  'category': 'McAfee+',
  'image_url': '',
  'tagline': 'Modern antivirus, VPN and identity monitoring for up to 5 devices.',
  'description': 'McAfee+ Essential delivers award-winning antivirus, an intelligent firewall, a Secure VPN, basic '
                 'identity monitoring and a Password Manager for up to five devices.',
  'features': ['Real-time antivirus & firewall',
               'Scam protection',
               'Secure VPN',
               'Identity monitoring alerts',
               'Password Manager',
               'Protection for 5 devices'],
  'variants': [{'devices': 5, 'years': 1, 'label': '5 Devices / 1 Year', 'price': 59.99, 'original_price': 89.99}],
  'long_description': "McAfee+ Essential is the entry point into McAfee's current subscription lineup. It covers up to "
                      'five devices with real-time antivirus, an intelligent firewall, a Secure VPN and a Password '
                      'Manager.\n'
                      '\n'
                      'Basic identity monitoring alerts you if your personal information is found where it should not '
                      'be, helping you act quickly to protect your accounts.',
  'platforms': ['windows', 'macos', 'android', 'ios'],
  'is_featured': False},
 {'slug': 'mcafee-plus-premium',
  'name': 'McAfee+ Premium',
  'brand': 'McAfee',
  'box_variant': 'red',
  'category': 'McAfee+',
  'image_url': '',
  'tagline': 'Unlimited devices with full identity theft protection, credit monitoring and $1 million coverage.',
  'description': 'McAfee+ Premium protects an unlimited number of devices and adds full identity theft protection, '
                 'credit monitoring, dark web monitoring and $1 million in identity theft coverage.',
  'features': ['Unlimited device protection',
               'Real-time antivirus & firewall',
               'Scam protection & VPN',
               'Credit monitoring',
               'Dark web monitoring',
               '$1 million identity theft coverage',
               'Identity restoration support'],
  'variants': [{'devices': 999,
                'years': 1,
                'label': 'Unlimited Devices / 1 Year',
                'price': 99.99,
                'original_price': 149.99}],
  'long_description': "McAfee+ Premium is McAfee's full-featured plan for households with many devices. It covers an "
                      'unlimited number of PCs, Macs, smartphones and tablets with antivirus, firewall, VPN and '
                      'password management.\n'
                      '\n'
                      'The Premium tier adds credit monitoring, dark web monitoring and up to $1 million in identity '
                      'theft coverage, along with identity restoration support from specialists.',
  'platforms': ['windows', 'macos', 'android', 'ios'],
  'is_featured': False},
 {'slug': 'mcafee-plus-advanced',
  'name': 'McAfee+ Advanced',
  'brand': 'McAfee',
  'box_variant': 'red',
  'category': 'McAfee+',
  'image_url': '',
  'tagline': 'Maximum device and identity protection with credit lock, credit scores and $1 million coverage.',
  'description': 'McAfee+ Advanced adds credit lock, monthly credit scores and dedicated identity restoration support '
                 'on top of unlimited device security, VPN and $1 million in identity coverage.',
  'features': ['Unlimited device protection',
               'Credit lock & monthly credit score',
               'Identity restoration support',
               'Real-time antivirus, firewall & VPN',
               'Dark web & credit monitoring',
               '$1 million identity theft coverage'],
  'variants': [{'devices': 999,
                'years': 1,
                'label': 'Unlimited Devices / 1 Year',
                'price': 149.99,
                'original_price': 199.99}],
  'long_description': "McAfee+ Advanced is McAfee's top consumer security tier. It includes everything in Premium plus "
                      'credit lock, monthly credit scores and hands-on identity restoration support if theft occurs.\n'
                      '\n'
                      'With unlimited device coverage, real-time antivirus, a firewall, VPN and $1 million in identity '
                      'theft coverage, it is built for users who want maximum digital safety and recovery support.',
  'platforms': ['windows', 'macos', 'android', 'ios'],
  'is_featured': False},
 {'slug': 'mcafee-livesafe',
  'name': 'McAfee LiveSafe',
  'brand': 'McAfee',
  'box_variant': 'red',
  'category': 'McAfee LiveSafe',
  'image_url': '',
  'tagline': 'Legacy unlimited-device antivirus with secure cloud storage and identity tools.',
  'description': 'McAfee LiveSafe offers unlimited-device antivirus, a Password Manager, secure cloud storage and '
                 'identity protection in one familiar McAfee package.',
  'features': ['Unlimited device protection',
               'Real-time antivirus & firewall',
               'Secure cloud storage',
               'Password Manager',
               'Identity protection basics',
               'Cross-device coverage'],
  'variants': [{'devices': 999,
                'years': 1,
                'label': 'Unlimited Devices / 1 Year',
                'price': 89.99,
                'original_price': 129.99}],
  'long_description': 'McAfee LiveSafe has been a trusted McAfee flagship for years. It covers an unlimited number of '
                      'devices with real-time antivirus, firewall, password management and secure cloud storage for '
                      'your important files.\n'
                      '\n'
                      'It also includes basic identity protection features, making it a well-rounded choice for '
                      'households that want one subscription to protect everything without moving to the newer McAfee+ '
                      'tiers.',
  'platforms': ['windows', 'macos', 'android', 'ios'],
  'is_featured': False},
 {'slug': 'norton-360-advanced',
  'name': 'Norton 360 Advanced',
  'brand': 'Norton',
  'box_variant': 'gold',
  'category': 'Norton 360',
  'image_url': '',
  'tagline': '10-device protection with 200 GB cloud backup, identity restoration and credit report access.',
  'description': 'Norton 360 Advanced covers up to 10 devices with real-time antivirus, a Secure VPN, Dark Web '
                 'Monitoring, 200 GB cloud backup, Social Media Monitoring, Identity Restoration Support and credit '
                 'report access.',
  'features': ['Real-time malware & ransomware protection',
               'AI-powered Scam Protection',
               'Deepfake Protection',
               'Secure VPN (10 devices)',
               'Dark Web & Social Media Monitoring',
               '200 GB cloud backup',
               'Identity Restoration Support',
               'Credit report & score access',
               'Password Manager & Parental Controls',
               '100% Virus Protection Promise'],
  'variants': [{'devices': 10, 'years': 1, 'label': '10 Devices / 1 Year', 'price': 119.99, 'original_price': 169.99}],
  'long_description': 'Norton 360 Advanced is the step above Premium for users who need more storage and identity '
                      'support. It protects up to 10 PCs, Macs, smartphones or tablets with real-time antivirus, '
                      'anti-ransomware and anti-phishing, plus a Secure VPN for up to 10 devices.\n'
                      '\n'
                      'It adds 200 GB of cloud backup, Dark Web Monitoring, Social Media Monitoring, Identity '
                      'Restoration Support and access to your credit report. AI-powered Scam Protection and Deepfake '
                      "Protection help you avoid today's most convincing online scams.",
  'platforms': ['windows', 'macos', 'android', 'ios'],
  'is_featured': False},
 {'slug': 'norton-360-lifelock-advantage',
  'name': 'Norton 360 with LifeLock Advantage',
  'brand': 'Norton',
  'box_variant': 'gold',
  'category': 'Norton 360 LifeLock',
  'image_url': '',
  'tagline': '10-device security plus enhanced LifeLock identity protection, $100K stolen funds reimbursement and '
             'credit alerts.',
  'description': 'Norton 360 with LifeLock Advantage covers up to 10 devices and adds stronger identity protection '
                 'including bank & credit card activity alerts, credit monitoring, Identity Lock and up to $100,000 in '
                 'stolen funds reimbursement for qualifying losses.',
  'features': ['Real-time malware & ransomware protection',
               'AI-powered Scam Protection Pro',
               'Deepfake Protection',
               'Secure VPN (10 devices)',
               'Dark Web Monitoring & Privacy Monitor',
               '250 GB cloud backup',
               'LifeLock identity theft protection',
               'Bank & credit card activity alerts',
               'Credit monitoring (one bureau)',
               'Identity Lock',
               'Up to $100,000 stolen funds reimbursement*',
               '100% Virus Protection Promise'],
  'variants': [{'devices': 10, 'years': 1, 'label': '10 Devices / 1 Year', 'price': 169.99, 'original_price': 259.99}],
  'long_description': 'Norton 360 with LifeLock Advantage includes everything in the Select tier plus stronger '
                      'identity monitoring and financial alerts. It covers up to 10 devices and provides bank & credit '
                      'card activity alerts, credit monitoring from one bureau, Identity Lock and up to $100,000 in '
                      'stolen funds reimbursement for qualifying identity theft losses.\n'
                      '\n'
                      'You also get 250 GB of cloud backup, a Secure VPN, Parental Controls, Dark Web Monitoring, '
                      'Privacy Monitor and AI-powered Scam Protection Pro.',
  'platforms': ['windows', 'macos', 'android', 'ios'],
  'is_featured': False},
 {'slug': 'norton-360-lifelock-ultimate-plus',
  'name': 'Norton 360 with LifeLock Ultimate Plus',
  'brand': 'Norton',
  'box_variant': 'gold',
  'category': 'Norton 360 LifeLock',
  'image_url': '',
  'tagline': 'Unlimited device security with 500 GB backup, three-bureau credit monitoring and $1M stolen funds '
             'reimbursement.',
  'description': "Norton 360 with LifeLock Ultimate Plus is Norton's most comprehensive plan. It covers unlimited "
                 'devices, includes 500 GB cloud backup, monitors all three credit bureaus, adds 401(k) & investment '
                 'account alerts, home title monitoring and up to $1 million in stolen funds reimbursement.',
  'features': ['Real-time malware & ransomware protection',
               'AI-powered Scam Protection Pro with reimbursement',
               'Deepfake Protection',
               'Secure VPN (unlimited devices)',
               'Dark Web Monitoring & Privacy Monitor',
               '500 GB cloud backup',
               'Three-bureau credit monitoring',
               '401(k) & investment account alerts',
               'Home title monitoring',
               'Up to $1 million stolen funds reimbursement*',
               'Up to $10,000 scam reimbursement',
               '100% Virus Protection Promise'],
  'variants': [{'devices': 999,
                'years': 1,
                'label': 'Unlimited Devices / 1 Year',
                'price': 249.99,
                'original_price': 364.99}],
  'long_description': 'Norton 360 with LifeLock Ultimate Plus is the top-tier Norton plan. It protects an unlimited '
                      'number of PCs, Macs, smartphones and tablets with real-time antivirus, a Secure VPN and 500 GB '
                      'of cloud backup.\n'
                      '\n'
                      'The LifeLock layer includes three-bureau credit monitoring, 401(k) & investment account alerts, '
                      'home title monitoring, Identity Lock, up to $1 million in stolen funds reimbursement and up to '
                      '$10,000 in scam reimbursement for qualifying losses.',
  'platforms': ['windows', 'macos', 'android', 'ios'],
  'is_featured': False},
 {'slug': 'mcafee-plus-ultimate',
  'name': 'McAfee+ Ultimate',
  'brand': 'McAfee',
  'box_variant': 'red',
  'category': 'McAfee+',
  'image_url': '',
  'tagline': 'Maximum identity, privacy and device protection with full-service data removal and unlimited devices.',
  'description': 'McAfee+ Ultimate delivers unlimited device antivirus, comprehensive identity monitoring, '
                 'full-service personal data cleanup from broker sites, social privacy management and up to $2 million '
                 'in identity theft coverage.',
  'features': ['Unlimited device protection',
               'Premium antivirus & firewall',
               'Scam protection & deepfake defense',
               'Secure VPN',
               'Full-service Personal Data Cleanup',
               'Social Privacy Manager',
               'Comprehensive identity monitoring',
               'Dark web monitoring',
               'Up to $2 million identity theft coverage',
               'Identity restoration experts'],
  'variants': [{'devices': 999,
                'years': 1,
                'label': 'Unlimited Devices / 1 Year',
                'price': 179.99,
                'original_price': 249.99}],
  'long_description': "McAfee+ Ultimate is McAfee's most comprehensive protection plan. It covers an unlimited number "
                      'of devices with premium antivirus, a firewall, VPN and scam protection, while adding '
                      'full-service Personal Data Cleanup that removes your info from data broker sites, a Social '
                      'Privacy Manager and comprehensive identity monitoring.\n'
                      '\n'
                      'It also includes up to $2 million in identity theft coverage and access to identity restoration '
                      'experts if you ever need help recovering from identity theft.',
  'platforms': ['windows', 'macos', 'android', 'ios', 'chromeos'],
  'is_featured': False},
 {'slug': 'webroot-total-protection',
  'name': 'Webroot Total Protection',
  'brand': 'Webroot',
  'box_variant': 'green',
  'category': 'Webroot Total Protection',
  'image_url': '',
  'tagline': "Webroot's most comprehensive plan: antivirus, unlimited backup, VPN, identity protection and parental "
             'controls for up to 10 devices.',
  'description': 'Webroot Total Protection combines cloud-based antivirus, unlimited secure cloud backup, a Secure '
                 'VPN, identity protection, parental controls and a password manager for up to 10 devices and 10 '
                 'identities.',
  'features': ['Cloud antivirus for up to 10 devices',
               'Unlimited secure cloud backup',
               'Secure VPN',
               'Identity protection & dark web monitoring',
               'Up to $1 million identity theft expense reimbursement*',
               'Parental controls',
               'Password manager',
               'Anti-phishing web shield',
               'Text scam detection & breach monitor'],
  'variants': [{'devices': 10, 'years': 1, 'label': '10 Devices / 1 Year', 'price': 89.99, 'original_price': 129.99}],
  'long_description': "Webroot Total Protection is the company's most complete consumer plan. It protects up to 10 "
                      'PCs, Macs, Chromebooks, smartphones and tablets with cloud-based antivirus that installs in '
                      'seconds and updates in real time.\n'
                      '\n'
                      'It adds unlimited secure cloud backup, a Secure VPN, identity protection with dark web '
                      'monitoring, up to $1 million in identity theft expense reimbursement, parental controls and a '
                      'password manager. Text scam detection and a breach monitor help you react quickly when threats '
                      'appear.',
  'platforms': ['windows', 'macos', 'android', 'ios', 'chromeos'],
  'is_featured': False}]

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
