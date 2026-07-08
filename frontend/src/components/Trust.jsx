import { ShieldCheck, LockKey, Envelope, CreditCard, Star, CheckCircle } from "@phosphor-icons/react";

export function TrustMarquee() {
  const items = [
    "10,000+ customers served",
    "100% authentic keys",
    "5-15 min email delivery",
    "Secure PayPal checkout",
    "30-day money back guarantee",
    "24/7 customer support",
  ];
  const doubled = [...items, ...items];
  return (
    <div className="border-y border-neutral-200 bg-neutral-900 py-3">
      <div className="marquee-container">
        <div className="marquee-track">
          {doubled.map((t, i) => (
            <div key={i} className="flex shrink-0 items-center gap-2 text-sm font-medium text-[#FCE029]">
              <ShieldCheck size={16} weight="fill" /> <span className="text-neutral-100">{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TrustBadges() {
  const badges = [
    { icon: <ShieldCheck size={22} weight="duotone" />, title: "Genuine Keys", desc: "Sourced directly from authorized partners." },
    { icon: <Envelope size={22} weight="duotone" />, title: "5–15 min Delivery", desc: "License keys emailed after payment." },
    { icon: <LockKey size={22} weight="duotone" />, title: "Secure Checkout", desc: "Encrypted PayPal transaction." },
    { icon: <CheckCircle size={22} weight="duotone" />, title: "Money-back", desc: "30-day refund if activation fails." },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {badges.map((b, i) => (
        <div key={i} data-testid={`trust-badge-${i}`} className="rounded-xl border border-neutral-200 bg-white p-6">
          <div className="text-neutral-900">{b.icon}</div>
          <div className="mt-3 font-display text-base font-semibold">{b.title}</div>
          <div className="mt-1 text-sm text-neutral-600">{b.desc}</div>
        </div>
      ))}
    </div>
  );
}

export function StarRating({ count = 5, rating = 4.9, reviews = 2340 }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex">
        {Array.from({ length: count }).map((_, i) => (
          <Star key={i} size={16} weight="fill" className="text-yellow-500" />
        ))}
      </div>
      <span className="text-sm text-neutral-600">{rating} · {reviews.toLocaleString()} reviews</span>
    </div>
  );
}

export function IconBadge({ children }) {
  return <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-900 text-[#FCE029]">{children}</div>;
}

export { CreditCard };
