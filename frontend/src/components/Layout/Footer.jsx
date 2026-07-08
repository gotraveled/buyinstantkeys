import { Link } from "react-router-dom";
import { ShieldCheck, MapPin, Envelope } from "@phosphor-icons/react";

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-50">
      <div className="container-page grid gap-10 py-16 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={22} weight="duotone" />
            <span className="font-display text-lg font-bold">BuyInstantKeys</span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-neutral-600">
            Authentic Norton license keys with instant email delivery. Trusted by thousands of customers worldwide.
          </p>
          <div className="mt-4 space-y-1 text-sm text-neutral-700">
            <div className="flex items-start gap-2">
              <MapPin size={16} weight="duotone" className="mt-0.5 shrink-0 text-neutral-500" />
              <span>Westwood Street, Hayward,<br />California, 94544, USA</span>
            </div>
            <div className="flex items-center gap-2">
              <Envelope size={16} weight="duotone" className="text-neutral-500" />
              <a href="mailto:info@buyinstantkeys.com" className="hover:text-neutral-900">info@buyinstantkeys.com</a>
            </div>
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Shop</div>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/products" className="text-neutral-700 hover:text-neutral-900">All Products</Link></li>
            <li><Link to="/products?category=Norton%20360" className="text-neutral-700 hover:text-neutral-900">Norton 360</Link></li>
            <li><Link to="/products?category=LifeLock" className="text-neutral-700 hover:text-neutral-900">LifeLock</Link></li>
            <li><Link to="/products?category=Privacy" className="text-neutral-700 hover:text-neutral-900">VPN & Privacy</Link></li>
            <li><Link to="/products?category=Business" className="text-neutral-700 hover:text-neutral-900">Business</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Help</div>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/track" className="text-neutral-700 hover:text-neutral-900">Track Order</Link></li>
            <li><Link to="/faq" className="text-neutral-700 hover:text-neutral-900">FAQ</Link></li>
            <li><Link to="/contact" className="text-neutral-700 hover:text-neutral-900">Contact</Link></li>
            <li><Link to="/refund-policy" className="text-neutral-700 hover:text-neutral-900">Refund Policy</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Trust</div>
          <ul className="mt-4 space-y-2 text-sm text-neutral-700">
            <li>Secure PayPal checkout</li>
            <li>Instant email delivery</li>
            <li>Genuine license keys</li>
            <li>30-day money back</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-neutral-200">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-xs text-neutral-500 md:flex-row">
          <div>© {new Date().getFullYear()} BuyInstantKeys. Norton is a trademark of Gen Digital Inc.</div>
          <div>buyinstantkeys.com · Hayward, CA</div>
        </div>
      </div>
    </footer>
  );
}
