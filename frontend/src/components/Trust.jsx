import { ShieldCheck, LockKey, Envelope, CreditCard, CheckCircle } from "@phosphor-icons/react";

export function TrustMarquee() {
  const items = [
    "Genuine license keys",
    "Email delivery in 5–15 min",
    "Secure PayPal checkout",
    "30-day money-back guarantee",
    "Independent reseller",
    "Activation service included",
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
    { icon: <ShieldCheck size={22} weight="duotone" />, title: "Genuine Keys", desc: "Verified, unused license keys from trusted channels." },
    { icon: <Envelope size={22} weight="duotone" />, title: "Fast Delivery", desc: "License keys emailed after payment." },
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

export function IconBadge({ children }) {
  return <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-900 text-[#FCE029]">{children}</div>;
}

export { CreditCard };
