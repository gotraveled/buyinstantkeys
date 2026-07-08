import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { api } from "@/lib/api";
import { toast } from "sonner";
import ProductBox from "@/components/ProductBox";
import { Trash, Minus, Plus, ArrowRight, ShoppingBag, Tag, X } from "@phosphor-icons/react";

export default function Cart() {
  const { items, updateQty, removeItem, subtotal, coupon, applyCoupon, removeCoupon } = useCart();
  const nav = useNavigate();
  const [code, setCode] = useState("");
  const [applying, setApplying] = useState(false);

  const apply = async () => {
    if (!code.trim()) return;
    setApplying(true);
    try {
      const r = await api.post("/coupons/validate", { code: code.trim().toUpperCase(), subtotal });
      applyCoupon({
        code: r.data.code, description: r.data.description,
        discount_type: r.data.discount_type, discount_value: r.data.discount_value,
      });
      toast.success(`Coupon applied — saved $${r.data.discount_amount.toFixed(2)}`);
      setCode("");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Invalid coupon");
    } finally {
      setApplying(false);
    }
  };

  const discountAmount = coupon
    ? (coupon.discount_type === "percent"
        ? Math.round(subtotal * (coupon.discount_value / 100) * 100) / 100
        : Math.min(coupon.discount_value, subtotal))
    : 0;
  const total = Math.max(0, subtotal - discountAmount);

  if (items.length === 0) {
    return (
      <div className="container-page py-20 text-center">
        <ShoppingBag size={44} weight="duotone" className="mx-auto text-neutral-400" />
        <h1 className="mt-4 font-display text-3xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-neutral-600">Browse our Norton products and add your favorites.</p>
        <Link to="/products" data-testid="empty-cart-shop-btn" className="btn-primary mt-8">Shop products</Link>
      </div>
    );
  }

  return (
    <div className="container-page py-14">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Your cart</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
            {items.map((it) => (
              <div key={it.key} data-testid={`cart-item-${it.product_slug}`} className="flex gap-4 p-5">
                <div className="h-24 w-24 shrink-0">
                  <ProductBox product={{ slug: it.product_slug, name: it.product_name, box_variant: it.box_variant, category: "", variants: [{ label: it.variant_label }] }} size="sm" showRibbon={false} />
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Link to={`/product/${it.product_slug}`} className="font-display font-semibold hover:underline">{it.product_name}</Link>
                      <div className="mt-0.5 text-sm text-neutral-500">{it.variant_label}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-lg font-bold">${(it.unit_price * it.quantity).toFixed(2)}</div>
                      <div className="text-xs text-neutral-500">${it.unit_price.toFixed(2)} each</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="inline-flex items-center rounded-lg border border-neutral-200">
                      <button data-testid={`cart-qty-dec-${it.product_slug}`} onClick={() => updateQty(it.key, it.quantity - 1)} className="p-2 hover:bg-neutral-50" disabled={it.quantity <= 1}>
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{it.quantity}</span>
                      <button data-testid={`cart-qty-inc-${it.product_slug}`} onClick={() => updateQty(it.key, it.quantity + 1)} className="p-2 hover:bg-neutral-50">
                        <Plus size={14} />
                      </button>
                    </div>
                    <button data-testid={`cart-remove-${it.product_slug}`} onClick={() => removeItem(it.key)} className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-red-600">
                      <Trash size={14} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="h-fit rounded-xl border border-neutral-200 bg-neutral-50 p-6">
          <h2 className="font-display text-lg font-semibold">Order summary</h2>

          <div className="mt-4">
            <label className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-600">Discount code</label>
            {coupon ? (
              <div data-testid="cart-coupon-applied" className="mt-1 flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
                <span className="inline-flex items-center gap-2 font-semibold text-emerald-800">
                  <Tag size={14} weight="fill" /> {coupon.code}
                </span>
                <button data-testid="cart-coupon-remove" onClick={removeCoupon} className="text-emerald-800 hover:text-red-600">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="mt-1 flex gap-2">
                <input
                  data-testid="cart-coupon-input"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="WELCOME10"
                  className="flex-1 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-yellow-500 focus:ring-2 focus:ring-yellow-400"
                />
                <button data-testid="cart-coupon-apply" onClick={apply} disabled={applying} className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60">
                  Apply
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-neutral-600">Subtotal</span><span data-testid="cart-subtotal">${subtotal.toFixed(2)}</span></div>
            {coupon && (
              <div className="flex justify-between text-emerald-700"><span>Discount ({coupon.code})</span><span data-testid="cart-discount">-${discountAmount.toFixed(2)}</span></div>
            )}
            <div className="flex justify-between"><span className="text-neutral-600">Delivery</span><span>Email · Free</span></div>
          </div>
          <div className="my-4 h-px bg-neutral-200" />
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-neutral-600">Total</span>
            <span data-testid="cart-total" className="font-display text-2xl font-bold">${total.toFixed(2)}</span>
          </div>
          <button data-testid="cart-checkout-btn" onClick={() => nav("/checkout")} className="btn-primary mt-6 w-full">
            Proceed to checkout <ArrowRight size={18} weight="bold" />
          </button>
          <div className="mt-4 text-center text-xs text-neutral-500">Secure PayPal checkout · Key delivered by email in 5–15 min</div>
        </aside>
      </div>
    </div>
  );
}
