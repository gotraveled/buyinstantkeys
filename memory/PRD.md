# BuyInstantKeys — Norton License Store

## Original Problem Statement
> "i have website hosted on github /vercel domain name buyinstantkeys.com i want to create a online store to sell norton products and license key will be delivered using email delivery in 5-15 minutes after payment received, I need to create the complete online store with 10-15 norton products"

## User Choices
- Payment: PayPal
- Email: Resend
- Key delivery: Manual (admin sends within 5-15 min)
- Admin panel: Full, login-protected
- Design: Trust/security focused

## Architecture
- Backend: FastAPI + MongoDB (motor)
- Frontend: React 19 + Tailwind + Shadcn + Phosphor icons
- Payment: PayPal REST (mock fallback via `/api/orders/{id}/simulate-payment`)
- Email: Resend (mock/log mode when key empty)
- Auth: JWT (admin only) with bcrypt

## Core Requirements
- 10-15 Norton products catalog
- Guest checkout with email
- Email license delivery within 5-15 min
- Admin dashboard for order management & key delivery
- Order tracking by email + order number

## What's been implemented (2026-07-08)
- 12 Norton products seeded (Norton 360 Deluxe/Standard/Premium/Advanced, AntiVirus Plus, Secure VPN, Utilities Ultimate, Family, Small Business, 360 for Gamers, Mobile Security, Password Manager) with 1-3 variants each
- Public pages: Home (hero + trust marquee + featured + how-it-works), Products (with category filters), Product Detail (variants + pricing), Cart, Checkout (PayPal + Simulate), Order Success, Track Order, FAQ, Contact, Refund Policy
- Admin pages: Login, Dashboard (stats + orders queue + product list + key delivery)
- Backend: 15+ endpoints (products, orders, tracking, PayPal create/capture, admin auth + CRUD + delivery, stats)
- Trust/security design with Outfit + IBM Plex fonts, yellow (#FCE029) accent, high-contrast
- Testing: full E2E passed (backend 100%, frontend 100%)

## Admin Credentials
- Email: `admin@buyinstantkeys.com`
- Password: `Admin@123456`
- Configurable via `ADMIN_EMAIL`/`ADMIN_PASSWORD` in `/app/backend/.env`

## Integration Keys Needed for Production
- PAYPAL_CLIENT_ID + PAYPAL_CLIENT_SECRET (currently empty → mock mode)
- RESEND_API_KEY + verified SENDER_EMAIL (currently empty → email mocked to logs)

## Backlog (P1)
- Coupon/discount codes
- Multiple items per order tested in UI (works but not visually polished)
- License key inventory pre-loaded per product (auto-deliver instead of manual)
- Order status webhooks / SMS notifications
- Sales analytics with charts (recharts already installed)
- SEO meta tags per product + sitemap
- Multi-currency (currently USD only)
- Login for customers (order history)

## Backlog (P2)
- Product reviews / ratings
- Related products on detail page
- Live chat integration
- Bulk business licensing tiers
