import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";
import ProductBox from "@/components/ProductBox";
import { LockKey, ShieldCheck, Envelope, CheckCircle, Tag } from "@phosphor-icons/react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

export default function Checkout() {
  const nav = useNavigate();
  const { items, subtotal, coupon, clearCart } = useCart();
  const [config, setConfig] = useState({ paypal_enabled: false });
  const [form, setForm] = useState({ customer_name: "", customer_email: "" });
  const [order, setOrder] = useState(null);
  const [creating, setCreating] = useState(false);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    api.get("/config").then((r) => setConfig(r.data));
  }, []);

  useEffect(() => {
    if (items.length === 0 && !order) nav("/cart");
  }, [items, order, nav]);

  const discountAmount = coupon
    ? (coupon.discount_type === "percent"
        ? Math.round(subtotal * (coupon.discount_value / 100) * 100) / 100
        : Math.min(coupon.discount_value, subtotal))
    : 0;
  const total = Math.max(0, subtotal - discountAmount);

  const createOrder = async () => {
    if (!form.customer_name.trim() || !form.customer_email.trim()) {
      toast.error("Please fill in your name and email.");
      return null;
    }
    setCreating(true);
    try {
      const payload = {
        customer_name: form.customer_name.trim(),
        customer_email: form.customer_email.trim().toLowerCase(),
        coupon_code: coupon?.code || null,
        items: items.map((i) => ({
          product_id: i.product_id, product_name: i.product_name,
          variant_id: i.variant_id, variant_label: i.variant_label,
          unit_price: i.unit_price, quantity: i.quantity,
          subtotal: i.unit_price * i.quantity,
        })),
      };
      const r = await api.post("/orders", payload);
      setOrder(r.data);
      return r.data;
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to create order");
      return null;
    } finally {
      setCreating(false);
    }
  };

  const finalizeOrder = (orderId, orderNumber) => {
    clearCart();
    toast.success("Payment successful!");
    nav(`/order-success?id=${orderId}&num=${orderNumber}`);
  };

  const handleSimulatePayment = async () => {
    setPaying(true);
    let o = order;
    if (!o) o = await createOrder();
    if (!o) { setPaying(false); return; }
    try {
      await api.post(`/orders/${o.id}/simulate-payment`);
      finalizeOrder(o.id, o.order_number);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="container-page py-14">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Checkout</h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            <h2 className="font-display text-lg font-semibold">Delivery details</h2>
            <p className="mt-1 text-sm text-neutral-600">Your license key will be sent to this email within 5–15 minutes.</p>
            <div className="mt-6 grid gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-600">Full name</label>
                <input
                  data-testid="checkout-name-input"
                  value={form.customer_name}
                  onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                  placeholder="John Smith"
                  disabled={!!order}
                  className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-4 py-3 text-sm focus:border-yellow-500 focus:ring-2 focus:ring-yellow-400 disabled:bg-neutral-100"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-600">Email address</label>
                <input
                  data-testid="checkout-email-input"
                  type="email"
                  value={form.customer_email}
                  onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
                  placeholder="you@example.com"
                  disabled={!!order}
                  className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-4 py-3 text-sm focus:border-yellow-500 focus:ring-2 focus:ring-yellow-400 disabled:bg-neutral-100"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6">
            <h2 className="font-display text-lg font-semibold">Payment</h2>
            <div className="mt-4 flex items-center gap-2 text-xs text-neutral-600">
              <LockKey size={14} weight="fill" className="text-emerald-600" /> Secured by 256-bit SSL encryption
            </div>

            {config.paypal_enabled ? (
              <div className="mt-6">
                <PayPalScriptProvider options={{ clientId: config.paypal_client_id, currency: "USD" }}>
                  <PayPalButtons
                    style={{ layout: "vertical", color: "gold", shape: "rect", label: "paypal" }}
                    createOrder={async () => {
                      const o = order || (await createOrder());
                      if (!o) throw new Error("Order failed");
                      const r = await api.post(`/orders/${o.id}/paypal/create`);
                      return r.data.paypal_order_id;
                    }}
                    onApprove={async (data) => {
                      const o = order;
                      if (!o) return;
                      await api.post(`/orders/${o.id}/paypal/capture`, { paypal_order_id: data.orderID });
                      finalizeOrder(o.id, o.order_number);
                    }}
                    onError={(err) => { console.error(err); toast.error("PayPal payment failed"); }}
                  />
                </PayPalScriptProvider>
              </div>
            ) : (
              <div className="mt-6">
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-neutral-800">
                  <strong>Demo mode:</strong> PayPal keys are not yet configured. Use the button below to simulate a paid order. Add real PayPal credentials in <code className="rounded bg-white px-1 py-0.5 text-xs">/app/backend/.env</code> to enable live PayPal checkout.
                </div>
                <button
                  data-testid="checkout-simulate-btn"
                  onClick={handleSimulatePayment}
                  disabled={paying || creating}
                  className="btn-primary mt-4 w-full"
                >
                  {paying ? "Processing..." : "Simulate PayPal payment (Demo)"}
                </button>
              </div>
            )}
          </div>
        </div>

        <aside className="lg:col-span-2">
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6">
            <h2 className="font-display text-lg font-semibold">Order summary</h2>
            <div className="mt-4 space-y-3">
              {items.map((it) => (
                <div key={it.key} className="flex gap-3 text-sm">
                  <div className="h-14 w-14 shrink-0">
                    <ProductBox product={{ slug: it.product_slug, name: it.product_name, box_variant: it.box_variant, category: "", variants: [{ label: "" }] }} size="sm" showRibbon={false} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{it.product_name}</div>
                    <div className="text-xs text-neutral-500">{it.variant_label} · Qty {it.quantity}</div>
                  </div>
                  <div className="font-semibold">${(it.unit_price * it.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>
            <div className="my-4 h-px bg-neutral-200" />
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-neutral-600">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              {coupon && (
                <div className="flex justify-between text-emerald-700"><span className="inline-flex items-center gap-1"><Tag size={12} weight="fill" /> {coupon.code}</span><span>-${discountAmount.toFixed(2)}</span></div>
              )}
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-sm text-neutral-600">Total</span>
              <span data-testid="checkout-total" className="font-display text-2xl font-bold">${total.toFixed(2)}</span>
            </div>
          </div>
          <div className="mt-4 space-y-2 rounded-xl border border-neutral-200 bg-white p-5 text-sm">
            <div className="flex items-center gap-2"><Envelope size={16} weight="duotone" /> Delivered to your inbox in 5–15 min</div>
            <div className="flex items-center gap-2"><ShieldCheck size={16} weight="duotone" /> Genuine Norton keys</div>
            <div className="flex items-center gap-2"><CheckCircle size={16} weight="duotone" /> 30-day money-back guarantee</div>
          </div>
        </aside>
      </div>
    </div>
  );
}
