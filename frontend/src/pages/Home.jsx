import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import ProductBox from "@/components/ProductBox";
import { TrustBadges, TrustMarquee, StarRating } from "@/components/Trust";
import { ShieldCheck, LockKey, Envelope, CreditCard, Lightning, ArrowRight, CheckCircle } from "@phosphor-icons/react";

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [heroProduct, setHeroProduct] = useState(null);
  useEffect(() => {
    api.get("/products", { params: { featured: true } }).then((r) => {
      setFeatured(r.data);
      const hero = r.data.find((p) => p.slug === "norton-360-deluxe") || r.data[0];
      setHeroProduct(hero);
    }).catch(() => {});
  }, []);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-neutral-200 grain-bg">
        <div className="container-page grid gap-12 py-20 md:grid-cols-2 md:py-32">
          <div className="fade-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-700">
              <ShieldCheck size={14} weight="fill" className="text-emerald-600" /> Authorized reseller · 100% genuine
            </div>
            <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
              Norton license keys.<br />
              <span className="relative inline-block">
                <span className="relative z-10">Delivered instantly.</span>
                <span className="absolute inset-x-0 bottom-1 z-0 h-3 bg-[#FCE029]" aria-hidden />
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-neutral-700">
              Get your genuine Norton 360, AntiVirus, VPN and more — emailed to your inbox within 5–15 minutes after payment. Save up to 70% off retail.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/products" data-testid="hero-shop-btn" className="btn-primary">
                Shop Norton products <ArrowRight size={18} weight="bold" />
              </Link>
              <Link to="/track" data-testid="hero-track-btn" className="btn-outline">Track my order</Link>
            </div>
            <div className="mt-8 flex items-center gap-6">
              <StarRating rating={4.9} reviews={2340} />
              <div className="flex items-center gap-1.5 text-sm text-neutral-700"><CheckCircle size={16} weight="fill" className="text-emerald-600" /> 30-day money back</div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-neutral-100 to-yellow-50 blur-2xl" />
            <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-gradient-to-br from-white to-neutral-50 p-6 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.25)]">
              <div className="mx-auto flex h-[440px] w-full items-center justify-center">
                {heroProduct && <ProductBox product={heroProduct} size="lg" />}
              </div>
              <div className="mt-4 rounded-xl border border-neutral-200 bg-white/95 p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-lg bg-neutral-900 text-[#FCE029]"><Envelope size={22} weight="duotone" /></div>
                  <div>
                    <div className="font-display text-sm font-semibold">License delivered to your inbox</div>
                    <div className="text-xs text-neutral-500">Typically within 5–15 minutes after payment</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <TrustMarquee />

      {/* FEATURED PRODUCTS */}
      <section className="container-page py-20 md:py-28">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Featured</div>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Bestselling Norton products</h2>
          </div>
          <Link to="/products" className="hidden text-sm font-semibold text-neutral-700 hover:text-neutral-900 md:inline-flex md:items-center md:gap-1">View all <ArrowRight size={16} /></Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => (<ProductCard key={p.id} product={p} />))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-y border-neutral-200 bg-neutral-50 py-20 md:py-28">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Simple, Fast, Secure</div>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">How it works</h2>
            <p className="mt-4 text-neutral-600">Buy your Norton license and get activated in minutes.</p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-12">
            {[
              { n: "01", icon: <ShieldCheck size={24} weight="duotone" />, title: "Choose your Norton product", desc: "Pick the plan and device count that fit your needs. Compare prices instantly.", span: "md:col-span-5" },
              { n: "02", icon: <CreditCard size={24} weight="duotone" />, title: "Checkout securely with PayPal", desc: "Encrypted payment. No account required. Guest checkout supported.", span: "md:col-span-7" },
              { n: "03", icon: <Envelope size={24} weight="duotone" />, title: "Get your key by email", desc: "Our team verifies your order and emails your genuine key within 5–15 minutes.", span: "md:col-span-7" },
              { n: "04", icon: <Lightning size={24} weight="duotone" />, title: "Activate on Norton.com", desc: "Sign in to my.norton.com, paste the key, and enjoy full protection.", span: "md:col-span-5" },
            ].map((s) => (
              <div key={s.n} className={`${s.span} rounded-2xl border border-neutral-200 bg-white p-8`}>
                <div className="flex items-center gap-4">
                  <div className="grid h-11 w-11 place-items-center rounded-lg bg-neutral-900 text-[#FCE029]">{s.icon}</div>
                  <span className="font-mono text-sm text-neutral-500">{s.n}</span>
                </div>
                <h3 className="mt-6 font-display text-xl font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-2 text-neutral-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST BADGES */}
      <section className="container-page py-20 md:py-28">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Why buy from us</div>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">A store you can trust</h2>
          </div>
        </div>
        <TrustBadges />
      </section>

      {/* CTA */}
      <section className="border-t border-neutral-200 bg-neutral-900 py-20 text-white">
        <div className="container-page flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Protect your devices today</h2>
            <p className="mt-2 max-w-xl text-neutral-300">Genuine Norton keys, delivered fast, backed by a 30-day money-back guarantee.</p>
          </div>
          <Link to="/products" data-testid="cta-shop-btn" className="btn-primary">Browse all products <ArrowRight size={18} weight="bold" /></Link>
        </div>
      </section>
    </div>
  );
}
