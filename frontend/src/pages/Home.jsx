import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import LoadError from "@/components/LoadError";
import SEO from "@/components/SEO";
import { TrustBadges, TrustMarquee } from "@/components/Trust";
import { BRAND_LIST } from "@/lib/brands";
import { ShieldCheck, LockKey, Envelope, CreditCard, Lightning, ArrowRight, CheckCircle, Key } from "@phosphor-icons/react";

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [featuredError, setFeaturedError] = useState(false);
  const [featuredLoading, setFeaturedLoading] = useState(true);

  const loadFeatured = () => {
    setFeaturedLoading(true);
    setFeaturedError(false);
    api.get("/products", { params: { featured: true } })
      .then((r) => setFeatured(r.data))
      .catch(() => setFeaturedError(true))
      .finally(() => setFeaturedLoading(false));
  };
  useEffect(loadFeatured, []);

  const homeSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "BuyInstantKeys",
    "url": "https://buyinstantkeys.com",
    "description": "Buy genuine antivirus license keys — Norton, Webroot & McAfee. Fast email delivery, secure checkout, 30-day money-back guarantee.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://buyinstantkeys.com/products?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "BuyInstantKeys",
    "url": "https://buyinstantkeys.com",
    "logo": "https://buyinstantkeys.com/logo.png",
    "description": "Independent digital software reseller specializing in genuine antivirus license keys — Norton, Webroot and McAfee — with fast email delivery.",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Westwood Street",
      "addressLocality": "Hayward",
      "addressRegion": "CA",
      "postalCode": "94544",
      "addressCountry": "US"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "email": "info@buyinstantkeys.com",
      "availableLanguage": "English"
    }
  };

  return (
    <>
      <SEO
        title="Buy Antivirus License Keys — Norton, Webroot & McAfee | BuyInstantKeys"
        description="Buy genuine antivirus license keys for Norton, Webroot & McAfee. Norton 360, Webroot Internet Security & McAfee Total Protection with fast email delivery and a 30-day money-back guarantee."
        keywords="antivirus license key, Norton key, Webroot keycode, McAfee activation code, buy antivirus online, genuine license keys, email delivery"
        schema={[homeSchema, organizationSchema]}
      />
      <div>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-neutral-200 bg-white">
        <div className="container-page grid gap-12 py-12 md:grid-cols-2 md:py-20">
          <div className="fade-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-700">
              <ShieldCheck size={14} weight="fill" className="text-emerald-600" /> Independent reseller · 100% genuine
            </div>
            <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
              Genuine antivirus keys.<br />
              <span className="relative inline-block">
                <span className="relative z-10">Delivered in minutes.</span>
                <span className="absolute inset-x-0 bottom-1 z-0 h-3 bg-neutral-900/10" aria-hidden />
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-neutral-700">
              Genuine Norton, Webroot and McAfee license keys, emailed to your inbox within 5–15 minutes of payment.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/products" data-testid="hero-shop-btn" className="btn-dark">
                Shop all products <ArrowRight size={18} weight="bold" />
              </Link>
              <Link to="/activation" data-testid="hero-activate-btn" className="btn-outline">Activate a key</Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2">
              <div className="flex items-center gap-1.5 text-sm text-neutral-700"><CheckCircle size={16} weight="fill" className="text-emerald-600" /> 30-day money-back guarantee</div>
              <div className="flex items-center gap-1.5 text-sm text-neutral-700"><LockKey size={16} weight="fill" className="text-emerald-600" /> Secure PayPal checkout</div>
            </div>
          </div>

          {/* Hero visual: 3 brand tiles */}
          <div className="relative flex items-center">
            <div className="grid w-full gap-4 sm:grid-cols-3">
              {BRAND_LIST.map((b, i) => (
                <Link
                  key={b.slug}
                  to={`/category/${b.slug}`}
                  className="group flex flex-col items-center rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                  style={{ marginTop: i === 1 ? "0" : "1.5rem" }}
                >
                  <div className="grid h-14 w-14 place-items-center rounded-xl text-white" style={{ backgroundColor: b.color, color: b.textOn }}>
                    <ShieldCheck size={26} weight="fill" />
                  </div>
                  <div className="mt-3 font-display text-lg font-bold">{b.name}</div>
                  <div className="mt-1 text-xs text-neutral-500">Genuine keys</div>
                  <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold" style={{ color: b.color }}>
                    Shop now <ArrowRight size={12} weight="bold" />
                  </div>
                </Link>
              ))}
            </div>
            <div className="absolute -bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 shadow-lg">
              <LockKey size={16} weight="duotone" />
              <span className="text-xs font-semibold">Email delivery · 5–15 min</span>
            </div>
          </div>
        </div>
      </section>

      <TrustMarquee />

      {/* SHOP BY BRAND */}
      <section className="container-page py-20 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Shop by brand</div>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Three trusted names in security</h2>
          <p className="mt-4 text-neutral-600">Choose your preferred antivirus brand — all genuine keys, delivered by email.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {BRAND_LIST.map((b) => (
            <Link
              key={b.slug}
              to={`/category/${b.slug}`}
              data-testid={`brand-card-${b.slug}`}
              className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-18px_rgba(0,0,0,0.18)]"
            >
              <div className="h-2 w-full" style={{ backgroundColor: b.color }} />
              <div className="p-7">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-xl text-white" style={{ backgroundColor: b.color, color: b.textOn }}>
                    <ShieldCheck size={24} weight="fill" />
                  </div>
                  <h3 className="font-display text-2xl font-bold tracking-tight">{b.name}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">{b.tagline}.</p>
                <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold" style={{ color: b.color }}>
                  Browse {b.name} products <ArrowRight size={16} weight="bold" className="transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="border-y border-neutral-200 bg-neutral-50 py-20 md:py-24">
        <div className="container-page">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Featured</div>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Bestselling security products</h2>
            </div>
            <Link to="/products" className="hidden text-sm font-semibold text-neutral-700 hover:text-neutral-900 md:inline-flex md:items-center md:gap-1">View all <ArrowRight size={16} /></Link>
          </div>
          {featuredLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-80 animate-pulse rounded-xl bg-neutral-100" />)}
            </div>
          ) : featuredError ? (
            <LoadError label="featured products" onRetry={loadFeatured} />
          ) : featured.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featured.slice(0, 6).map((p) => (<ProductCard key={p.id} product={p} />))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center text-neutral-600">
              No featured products right now. <Link to="/products" className="font-semibold underline">Browse all products</Link>
            </div>
          )}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="container-page py-20 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Simple, Fast, Secure</div>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">How it works</h2>
          <p className="mt-4 text-neutral-600">Buy your license and activate in minutes.</p>
        </div>
        <div className="mt-10 md:mt-14 grid gap-4 md:gap-6 md:grid-cols-12">
          {[
            { n: "01", icon: <ShieldCheck size={24} weight="duotone" />, title: "Choose your product", desc: "Pick the brand, plan and device count that fit your needs.", span: "md:col-span-5" },
            { n: "02", icon: <CreditCard size={24} weight="duotone" />, title: "Checkout securely", desc: "Encrypted payment with PayPal. No account required.", span: "md:col-span-7" },
            { n: "03", icon: <Envelope size={24} weight="duotone" />, title: "Get your key by email", desc: "We verify your order and email your genuine key in 5–15 minutes.", span: "md:col-span-7" },
            { n: "04", icon: <Lightning size={24} weight="duotone" />, title: "Activate & protect", desc: "Enter your key on the official site and enjoy full protection.", span: "md:col-span-5" },
          ].map((s) => (
            <div key={s.n} className={`${s.span} rounded-2xl border border-neutral-200 bg-white p-8`}>
              <div className="flex items-center gap-4">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-neutral-900 text-white">{s.icon}</div>
                <span className="font-mono text-sm text-neutral-500">{s.n}</span>
              </div>
              <h3 className="mt-6 font-display text-xl font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-2 text-neutral-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TRUST BADGES */}
      <section className="border-t border-neutral-200 bg-neutral-50 py-20">
        <div className="container-page">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Why buy from us</div>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">A store you can trust</h2>
            </div>
          </div>
          <TrustBadges />
        </div>
      </section>

      {/* SEO CONTENT — multi-brand, compliant */}
      <section className="border-t border-neutral-200 bg-white py-20">
        <div className="container-page">
          <div className="mx-auto max-w-4xl">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">About our store</div>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">Genuine antivirus keys from an independent reseller</h2>

            <div className="mt-8 space-y-6 text-neutral-700">
              <p>
                BuyInstantKeys is an independent digital software reseller. We sell genuine activation keys for leading antivirus brands — <strong>Norton</strong>, <strong>Webroot</strong> and <strong>McAfee</strong>. Every key is sourced from trusted channels, verified before delivery, and emailed to you within minutes of checkout.
              </p>

              <h3 className="font-display text-xl font-semibold text-neutral-900">Norton — layered device & identity protection</h3>
              <p>
                Norton 360 plans combine real-time antivirus with a Secure VPN, Password Manager, Dark Web Monitoring and cloud backup. From the affordable Norton AntiVirus Plus to Norton 360 with LifeLock identity protection, there's a plan for every household.
              </p>

              <h3 className="font-display text-xl font-semibold text-neutral-900">Webroot — lightweight, cloud-based security</h3>
              <p>
                Webroot is built for speed. Its cloud-based engine scans in seconds and uses a fraction of the system resources of traditional antivirus, making it ideal for older PCs and anyone who wants protection without slowdown.
              </p>

              <h3 className="font-display text-xl font-semibold text-neutral-900">McAfee — all-in-one family protection</h3>
              <p>
                McAfee Total Protection and McAfee+ plans cover everything from antivirus and VPN to identity monitoring and parental controls — with options for unlimited devices so the whole family stays protected.
              </p>

              <h3 className="font-display text-xl font-semibold text-neutral-900">Why buy from BuyInstantKeys?</h3>
              <p>
                We keep it simple: genuine keys, fast email delivery, secure PayPal checkout, and a 30-day money-back guarantee. If a key ever fails to activate, we'll replace it or refund you. Every order also includes our activation service to get you set up quickly.
              </p>

              <div className="mt-8 rounded-xl border border-neutral-200 bg-neutral-50 p-6">
                <div className="flex items-start gap-3">
                  <ShieldCheck size={22} weight="duotone" className="mt-1 shrink-0 text-neutral-900" />
                  <div>
                    <div className="font-display font-semibold">Independent reseller — not affiliated with the brands</div>
                    <p className="mt-1 text-sm text-neutral-700">
                      BuyInstantKeys is an independent reseller and is not affiliated with, endorsed by, or sponsored by Norton/Gen Digital, Webroot/OpenText, or McAfee. All trademarks belong to their respective owners and are used here only to identify the genuine products we sell.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-neutral-200 bg-neutral-900 py-20 text-white">
        <div className="container-page flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Protect your devices today</h2>
            <p className="mt-2 max-w-xl text-neutral-300">Genuine Norton, Webroot & McAfee keys, delivered by email, backed by a 30-day money-back guarantee.</p>
          </div>
          <Link to="/products" data-testid="cta-shop-btn" className="btn-primary">Browse all products <ArrowRight size={18} weight="bold" /></Link>
        </div>
      </section>
    </div>
    </>
  );
}
