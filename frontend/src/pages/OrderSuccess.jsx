import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { CheckCircle, Envelope, Clock, Package } from "@phosphor-icons/react";

export default function OrderSuccess() {
  const [params] = useSearchParams();
  const [order, setOrder] = useState(null);
  const id = params.get("id");
  const num = params.get("num");

  useEffect(() => {
    if (id) api.get(`/orders/${id}`).then((r) => setOrder(r.data)).catch(() => {});
  }, [id]);

  return (
    <div className="container-page py-20">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle size={40} weight="duotone" />
        </div>
        <h1 data-testid="order-success-title" className="mt-6 font-display text-3xl font-bold sm:text-4xl">Payment received!</h1>
        <p className="mt-3 text-neutral-600">Thank you! Your order has been confirmed and is being processed by our team.</p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 font-mono text-sm">
          Order number: <span data-testid="order-success-number" className="font-semibold">{num || order?.order_number}</span>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-neutral-200 bg-white p-6 text-left">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-neutral-900 text-[#FCE029]"><CheckCircle size={18} weight="duotone" /></div>
            <div className="mt-3 font-semibold">Payment received</div>
            <div className="mt-1 text-xs text-neutral-600">Confirmed via checkout</div>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-6 text-left">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-neutral-900 text-[#FCE029]"><Clock size={18} weight="duotone" /></div>
            <div className="mt-3 font-semibold">Team verifying</div>
            <div className="mt-1 text-xs text-neutral-600">Typically 5–15 minutes</div>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-6 text-left">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-neutral-900 text-[#FCE029]"><Envelope size={18} weight="duotone" /></div>
            <div className="mt-3 font-semibold">Key delivered by email</div>
            <div className="mt-1 text-xs text-neutral-600">Check inbox & spam</div>
          </div>
        </div>

        <div className="mt-10 rounded-xl border border-yellow-200 bg-yellow-50 p-6 text-left">
          <div className="font-display font-semibold">What happens next?</div>
          <p className="mt-2 text-sm text-neutral-700">
            Our team is verifying your payment and will email your genuine Norton license key(s) to <span className="font-semibold">{order?.customer_email || "your email"}</span> within 5–15 minutes. If you don't see it, check your spam folder.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/track" data-testid="success-track-btn" className="btn-outline"><Package size={18} weight="duotone" /> Track order</Link>
          <Link to="/products" className="btn-primary">Continue shopping</Link>
        </div>
      </div>
    </div>
  );
}
