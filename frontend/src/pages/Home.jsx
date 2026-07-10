import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import ProductBox from "@/components/ProductBox";
import SEO from "@/components/SEO";
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

  const homeSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "BuyInstantKeys",
    "url": "https://buyinstantkeys.com",
    "description": "Buy genuine Norton license keys at up to 70% off retail. Instant email delivery, 100% authentic keys, 30-day money-back guarantee.",
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
    "description": "Independent digital software reseller specializing in genuine Norton license keys with instant email delivery.",
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
      "telephone": "+1-510-555-0123",
      "contactType": "customer service",
      "email": "info@buyinstantkeys.com",
      "availableLanguage": "English"
    }
  };

  return (
    <>
      <SEO
        title="Buy Norton License Keys - Instant Delivery | Up to 70% Off"
        description="Buy genuine Norton 360, Norton with LifeLock, VPN & more at up to 70% off retail. Instant email delivery, 100% authentic keys, 30-day money-back guarantee. Norton 360 Deluxe with LifeLock deals."
        keywords="Norton 360 Deluxe with LifeLock, Norton license keys, Norton 360, Norton antivirus, Norton VPN, LifeLock identity protection, Norton 360 Premium, Norton 360 Deluxe, cheap Norton keys, genuine Norton software"
        schema={[homeSchema, organizationSchema]}
      />
      <div>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-neutral-200 grain-bg">
        <div className="container-page grid gap-12 py-10 md:grid-cols-2 md:py-16">
          <div className="fade-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-700">
              <ShieldCheck size={14} weight="fill" className="text-emerald-600" /> Trusted reseller · 100% genuine
            </div>
            <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
              Genuine Antivirus License.<br />
              <span className="relative inline-block">
                <span className="relative z-10">Digitally Delivered</span>
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
              <Link to="/activation" data-testid="hero-activate-btn" className="btn-outline">Activate Your Subscription</Link>
            </div>
            <div className="mt-8 flex items-center gap-6">
              <StarRating rating={4.9} reviews={2340} />
              <div className="flex items-center gap-1.5 text-sm text-neutral-700"><CheckCircle size={16} weight="fill" className="text-emerald-600" /> 30-day money back</div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-yellow-50 via-white to-neutral-50 blur-2xl" />

            {/* Hero composition: layered product cards + floating trust badges */}
            <div className="relative mx-auto flex h-[300px] w-full max-w-[520px] items-center justify-center sm:h-[400px] md:h-[480px]">
              {/* Background soft grid */}
              <div className="absolute inset-0 rounded-3xl border border-neutral-200 bg-white/80 backdrop-blur"
                   style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.06) 1px, transparent 0)", backgroundSize: "20px 20px" }} />

              {/* Big central shield */}
              <div className="relative z-10 grid h-40 w-40 place-items-center rounded-full bg-white shadow-[0_30px_60px_-20px_rgba(252,194,32,0.55)] sm:h-48 sm:w-48 md:h-56 md:w-56">
                <div className="grid h-32 w-32 place-items-center rounded-full bg-[#FFC220] sm:h-36 sm:w-36 md:h-44 md:w-44">
                  <ShieldCheck size={60} weight="fill" className="text-white sm:size={75} md:size={90}" />
                </div>
              </div>

              {/* Left floating product card */}
              {heroProduct && (
                <div className="absolute left-1 top-6 z-20 h-40 w-32 -rotate-[8deg] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.25)] sm:left-2 sm:top-8 sm:h-48 sm:w-40 md:h-52 md:w-44">
                  <ProductBox product={heroProduct} size="sm" />
                </div>
              )}
              {/* Right floating product card */}
              {featured[1] && (
                <div className="absolute right-1 bottom-6 z-20 h-40 w-32 rotate-[8deg] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.25)] sm:right-2 sm:bottom-8 sm:h-48 sm:w-40 md:h-52 md:w-44">
                  <ProductBox product={featured[1]} size="sm" />
                </div>
              )}

              {/* Floating pill: PayPal secure */}
              <div className="absolute -bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 shadow-lg">
                <LockKey size={16} weight="duotone" />
                <span className="text-xs font-semibold">Instant email delivery · 5–15 min</span>
              </div>

              {/* Floating small badge (top-right) */}
              <div className="absolute right-4 top-4 z-30 flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                <CheckCircle size={12} weight="fill" /> 100% Genuine
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
          {featured.slice(0, 8).map((p) => (<ProductCard key={p.id} product={p} />))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-y border-neutral-200 bg-neutral-50 py-12 md:py-16 lg:py-20">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Simple, Fast, Secure</div>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">How it works</h2>
            <p className="mt-4 text-neutral-600">Buy your Norton license and get activated in minutes.</p>
          </div>
          <div className="mt-10 md:mt-14 grid gap-4 md:gap-6 md:grid-cols-12">
            {[
              { n: "01", icon: <ShieldCheck size={24} weight="duotone" />, title: "Choose your Norton product", desc: "Pick the plan and device count that fit your needs. Compare prices instantly.", span: "md:col-span-5" },
              { n: "02", icon: <CreditCard size={24} weight="duotone" />, title: "Checkout securely with PayPal", desc: "Encrypted payment. No account required. Guest checkout available.", span: "md:col-span-7" },
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

      {/* SEO CONTENT */}
      <section className="border-t border-neutral-200 bg-neutral-50 py-20">
        <div className="container-page">
          <div className="mx-auto max-w-4xl">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">About Norton Security</div>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">Why choose Norton for your digital protection</h2>
            
            <div className="mt-8 space-y-6 text-neutral-700">
              <p>
                Norton is a globally recognized leader in cybersecurity, providing comprehensive protection against viruses, malware, ransomware, and other online threats. When you <strong>buy Norton license keys</strong> from BuyInstantKeys, you're getting authentic software at up to 70% off retail prices. Our genuine Norton 360 Deluxe with LifeLock, Norton AntiVirus Plus, and Norton 360 Premium plans offer multi-layered protection for your devices, data, and identity.
              </p>
              
              <h3 className="font-display text-xl font-semibold text-neutral-900">Norton 360 Deluxe with LifeLock - Complete Protection</h3>
              <p>
                Norton 360 Deluxe with LifeLock combines advanced security with identity theft protection. This comprehensive solution includes real-time threat protection, secure VPN, password manager, cloud backup, and LifeLock identity monitoring. Perfect for families and individuals who want all-around digital security. Our Norton 360 Deluxe deals make it affordable to protect multiple devices.
              </p>
              
              <h3 className="font-display text-xl font-semibold text-neutral-900">Norton AntiVirus Plus - Essential Security</h3>
              <p>
                Norton AntiVirus Plus provides essential protection for your PC or Mac. It defends against malware, viruses, ransomware, and other online threats with advanced security technology. Ideal for users who want focused antivirus protection without additional features. Get cheap Norton AntiVirus keys with instant email delivery from BuyInstantKeys.
              </p>
              
              <h3 className="font-display text-xl font-semibold text-neutral-900">Norton 360 Premium - Maximum Coverage</h3>
              <p>
                Norton 360 Premium offers the most comprehensive protection with coverage for up to 10 devices. Includes PC, Mac, iOS, and Android protection, plus secure VPN, password manager, cloud backup, and parental controls. Perfect for large families or small businesses. Our Norton 360 Premium license keys provide maximum security at discounted prices.
              </p>
              
              <h3 className="font-display text-xl font-semibold text-neutral-900">Why Buy Norton Keys from BuyInstantKeys?</h3>
              <p>
                BuyInstantKeys is your trusted source for genuine Norton license keys. We offer instant email delivery within 5-15 minutes, 100% authentic keys, and a 30-day money-back guarantee. Our Norton 360 Deluxe with LifeLock deals, Norton AntiVirus discounts, and Norton 360 Premium offers help you save up to 70% off retail. All our Norton software keys are verified and guaranteed to work.
              </p>
              
              <h3 className="font-display text-xl font-semibold text-neutral-900">How to Activate Your Norton Subscription</h3>
              <p>
                After purchasing your Norton license key from BuyInstantKeys, activation is simple. Sign in to your Norton account at my.norton.com, enter your 25-digit product key, and download your Norton software. Our activation team provides free guidance if you need assistance. Whether you're activating Norton 360 Deluxe, Norton AntiVirus Plus, or Norton 360 Premium, the process takes just minutes.
              </p>
              
              <div className="mt-8 rounded-xl border border-yellow-200 bg-yellow-50 p-6">
                <div className="flex items-start gap-3">
                  <ShieldCheck size={22} weight="duotone" className="mt-1 shrink-0 text-neutral-900" />
                  <div>
                    <div className="font-display font-semibold">Genuine Norton Keys Guaranteed</div>
                    <p className="mt-1 text-sm text-neutral-700">
                      All Norton license keys from BuyInstantKeys are 100% genuine and authentic. We source directly from authorized distributors and verify every key before delivery. Your Norton subscription will activate without any issues.
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
            <p className="mt-2 max-w-xl text-neutral-300">Genuine Norton keys, delivered fast, backed by a 30-day money-back guarantee.</p>
          </div>
          <Link to="/products" data-testid="cta-shop-btn" className="btn-primary">Browse all products <ArrowRight size={18} weight="bold" /></Link>
        </div>
      </section>
    </div>
    </>
  );
}
