import { Link, useLocation } from "react-router-dom";
import { ShieldCheck, ShoppingCart, Package } from "@phosphor-icons/react";
import { useCart } from "@/lib/cart";

export default function Navbar() {
  const { count } = useCart();
  const loc = useLocation();
  const NavLink = ({ to, children, testId }) => {
    const active = loc.pathname === to;
    return (
      <Link
        to={to}
        data-testid={testId}
        className={`text-sm font-medium tracking-tight transition-colors ${active ? "text-neutral-900" : "text-neutral-600 hover:text-neutral-900"}`}
      >
        {children}
      </Link>
    );
  };
  return (
    <header className="glass-header sticky top-0 z-40 border-b border-neutral-200">
      <div className="container-page flex h-16 items-center justify-between">
        <Link to="/" data-testid="nav-logo" className="flex items-center gap-2">
          <ShieldCheck size={26} weight="duotone" className="text-neutral-900" />
          <span className="font-display text-lg font-bold tracking-tight">
            Buy<span className="text-neutral-900">Instant</span>
            <span className="rounded bg-[#FCE029] px-1">Keys</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <NavLink to="/" testId="nav-home">Home</NavLink>
          <NavLink to="/products" testId="nav-products">All Products</NavLink>
          <NavLink to="/activation" testId="nav-activation">Activate</NavLink>
          <NavLink to="/track" testId="nav-track">Track Order</NavLink>
          <NavLink to="/faq" testId="nav-faq">FAQ</NavLink>
          <NavLink to="/contact" testId="nav-contact">Contact</NavLink>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/track" data-testid="nav-track-icon" className="hidden rounded-md p-2 text-neutral-700 hover:bg-neutral-100 sm:inline-flex">
            <Package size={20} weight="duotone" />
          </Link>
          <Link
            to="/cart"
            data-testid="nav-cart"
            className="relative inline-flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold hover:border-neutral-900"
          >
            <ShoppingCart size={18} weight="duotone" />
            <span>Cart</span>
            {count > 0 && (
              <span data-testid="nav-cart-count" className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FCE029] px-1.5 text-xs font-bold text-neutral-900">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
