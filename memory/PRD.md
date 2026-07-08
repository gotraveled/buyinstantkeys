# BuyInstantKeys — Norton License Store

## Original Problem Statement
> "i have website hosted on github /vercel domain name buyinstantkeys.com i want to create a online store to sell norton products and license key will be delivered using email delivery in 5-15 minutes after payment received, I need to create the complete online store with 10-15 norton products"

## User Choices
- Payment: PayPal
- Email: Resend
- Key delivery: Manual (admin sends within 5-15 min)
- Admin panel: Full, login-protected
- Design: Trust/security focused
- (Iteration 2) Add all Norton products including LifeLock variants, +$20 pricing, Norton product-box images, coupon system + limited-time offer banner

## Architecture
- Backend: FastAPI + MongoDB (motor)
- Frontend: React 19 + Tailwind + Shadcn + Phosphor icons
- Payment: PayPal REST (mock fallback via `/api/orders/{id}/simulate-payment`)
- Email: Resend (mock/log mode when key empty)
- Auth: JWT (admin only) with bcrypt
- Product visuals: In-app SVG `ProductBox` component (5 tier colors: gold/amber/black/green/purple)

## Core Requirements
- Full Norton product catalog with LifeLock variants
- Guest checkout with email
- Email license delivery within 5-15 min
- Admin dashboard for order management & key delivery
- Order tracking by email + order number
- Coupon codes + limited-time offer banner

## Iteration 1 (2026-07-08)
- Seeded 12 Norton products, admin auth, order flow, PayPal integration (mock fallback), Resend integration (mock fallback), admin dashboard, full E2E tests passed

## Iteration 2 (2026-07-08)
- Expanded catalog to **20 products** including all major Norton offerings:
  Norton AntiVirus Plus, 360 Standard, 360 Deluxe, 360 Deluxe Advantage, 360 with LifeLock Select, LifeLock Select Plus, LifeLock Advantage, LifeLock Ultimate Plus, 360 for Gamers, VPN, AntiTrack, Identity Advisor Plus, Utilities Ultimate, Family, Small Business, Mobile Security, Password Manager, Ultimate Help Desk, Genie Scam Detector, 360 Premium
- **+$20 markup** applied to all base prices (with proportional strike-through original prices)
- Replaced Unsplash images with **SVG-based Norton-branded product boxes** rendered client-side via `ProductBox` component — always renders, no external dependency
- Added **coupon/discount code system**: WELCOME10 (10% off), SAVE20 ($20 off $80+), FLASH70 (70% off, limited use); public `POST /api/coupons/validate` + admin CRUD; cart + checkout UI to apply/remove codes
- Added **limited-time offer banner** with live countdown timer visible on all public pages; admin can update via `PATCH /api/admin/banner`
- Full E2E tests passed: backend 15/15, frontend 100%
- Reseed via `SEED_VERSION` bump (currently 2026-02-v3)

## Admin Credentials
- Email: `admin@buyinstantkeys.com`
- Password: `Admin@123456`

## Coupon Codes (seeded)
- `WELCOME10` — 10% off any order
- `SAVE20` — $20 off orders ≥ $80
- `FLASH70` — 70% off (limited to 100 uses)

## Integration Keys Needed for Production
- PAYPAL_CLIENT_ID + PAYPAL_CLIENT_SECRET (currently empty → mock mode)
- RESEND_API_KEY + verified SENDER_EMAIL (currently empty → email mocked to logs)

## Backlog (P1)
- Admin coupon management UI (backend API exists; frontend can add a Coupons tab)
- Admin banner editor UI (backend API exists)
- Pre-loaded key inventory per product for auto-delivery
- Sales analytics with charts (recharts installed)
- SEO meta tags per product + sitemap
- Multi-currency support

## Backlog (P2)
- Product reviews / ratings
- Customer login for order history
- Live chat integration
- Bulk business licensing tiers
