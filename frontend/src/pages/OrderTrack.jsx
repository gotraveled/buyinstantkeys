import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Package, CheckCircle, Clock, Envelope } from "@phosphor-icons/react";

const statusMeta = {
  pending: { label: "Awaiting payment", color: "bg-neutral-100 text-neutral-700" },
  paid: { label: "Payment received — preparing keys", color: "bg-yellow-100 text-yellow-800" },
  delivered: { label: "Delivered — check your email", color: "bg-emerald-100 text-emerald-800" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" },
  refunded: { label: "Refunded", color: "bg-neutral-100 text-neutral-700" },
};

export default function OrderTrack() {
  const [form, setForm] = useState({ email: "", order_number: "" });
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setOrder(null);
    try {
      const r = await api.post("/orders/track", form);
      setOrder(r.data);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Order not found");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page py-14">
      <div className="mx-auto max-w-3xl">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Order tracking</div>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Track your order</h1>
        <p className="mt-3 text-neutral-600">Enter your order number and email to check status and view delivered license keys.</p>

        <form onSubmit={submit} className="mt-8 grid gap-4 rounded-xl border border-neutral-200 bg-white p-6 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-600">Order number</label>
            <input
              data-testid="track-order-number-input"
              value={form.order_number}
              onChange={(e) => setForm({ ...form, order_number: e.target.value })}
              required
              placeholder="BIK-20260201-ABC123"
              className="mt-1 w-full rounded-md border border-neutral-300 px-4 py-3 text-sm focus:border-yellow-500 focus:ring-2 focus:ring-yellow-400"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-600">Email</label>
            <input
              data-testid="track-email-input"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              placeholder="you@example.com"
              className="mt-1 w-full rounded-md border border-neutral-300 px-4 py-3 text-sm focus:border-yellow-500 focus:ring-2 focus:ring-yellow-400"
            />
          </div>
          <div className="sm:col-span-2">
            <button data-testid="track-submit-btn" type="submit" disabled={loading} className="btn-primary w-full sm:w-auto">
              <Package size={18} weight="duotone" /> {loading ? "Searching..." : "Track order"}
            </button>
          </div>
        </form>

        {order && (
          <div data-testid="track-result" className="mt-8 rounded-xl border border-neutral-200 bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs text-neutral-500">Order</div>
                <div className="font-display text-xl font-bold">{order.order_number}</div>
              </div>
              <span data-testid="track-status" className={`rounded-full px-3 py-1 text-sm font-semibold ${statusMeta[order.status]?.color}`}>
                {statusMeta[order.status]?.label || order.status}
              </span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3 text-sm">
              <div className="rounded-lg bg-neutral-50 p-3">
                <div className="text-xs text-neutral-500">Customer</div>
                <div className="font-semibold">{order.customer_name}</div>
              </div>
              <div className="rounded-lg bg-neutral-50 p-3">
                <div className="text-xs text-neutral-500">Email</div>
                <div className="font-semibold">{order.customer_email}</div>
              </div>
              <div className="rounded-lg bg-neutral-50 p-3">
                <div className="text-xs text-neutral-500">Total</div>
                <div className="font-semibold">${order.total.toFixed(2)}</div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {order.items.map((it, i) => (
                <div key={i} className="rounded-lg border border-neutral-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{it.product_name}</div>
                      <div className="text-xs text-neutral-500">{it.variant_label} · Qty {it.quantity}</div>
                    </div>
                    <div className="text-sm font-semibold">${it.subtotal.toFixed(2)}</div>
                  </div>
                  {it.license_key ? (
                    <div className="mt-3 rounded-md bg-neutral-900 p-3 font-mono text-sm tracking-wider text-[#FCE029]">
                      {it.license_key}
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center gap-2 text-xs text-neutral-600">
                      <Clock size={14} weight="duotone" /> License key pending. Check your email in a few minutes.
                    </div>
                  )}
                </div>
              ))}
            </div>

            {order.status !== "delivered" && (
              <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-neutral-800">
                <div className="flex items-center gap-2 font-semibold"><Envelope size={16} weight="duotone" /> Delivery in progress</div>
                <p className="mt-1">Your license key will arrive by email within 5–15 minutes after payment is verified. Check spam too.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
