import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import BrandDisclaimer from "@/components/BrandDisclaimer";
import { BRAND_LIST } from "@/lib/brands";
import { ShieldCheck, ArrowRight, Clock, Headset } from "@phosphor-icons/react";

export default function Activation() {
  return (
    <div className="bg-neutral-50">
      <SEO
        title="Antivirus Activation Assistance — Norton, Webroot & McAfee | BuyInstantKeys"
        description="Free activation assistance for Norton, Webroot and McAfee license keys from BuyInstantKeys, an independent reseller. Choose your brand for step-by-step setup help."
        keywords="antivirus activation help, Norton activation assistance, Webroot setup help, McAfee activation support, license key help, independent reseller"
      />

      {/* Hero */}
      <section className="border-b border-neutral-200 bg-white">
        <div className="container-page py-12 md:py-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-700">
            <Headset size={14} weight="fill" className="text-neutral-900" /> BuyInstantKeys activation assistance
          </div>
          <h1 className="mx-auto mt-5 max-w-2xl font-display text-4xl font-bold leading-[1.05] tracking-tight text-neutral-900 sm:text-5xl">
            Free help activating your key
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-neutral-600">
            Choose the brand of the license key you purchased from us. Our support team will walk you through activation on the official portal — usually within 5–15 minutes.
          </p>
          <p className="mx-auto mt-4 max-w-xl rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
            BuyInstantKeys is an independent reseller — not affiliated with Norton, Webroot or McAfee. Activation is always completed on the brand's official website.
          </p>
        </div>
      </section>

      {/* Brand picker */}
      <section className="container-page py-14 md:py-20">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {BRAND_LIST.map((b) => (
            <Link
              key={b.slug}
              to={`/activation/${b.slug}`}
              data-testid={`activation-brand-${b.slug}`}
              className="group rounded-2xl border border-neutral-200 bg-white p-8 text-center transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-18px_rgba(0,0,0,0.18)]"
            >
              <div
                className="mx-auto grid h-16 w-16 place-items-center rounded-2xl text-white"
                style={{ backgroundColor: b.color, color: b.textOn }}
              >
                <ShieldCheck size={30} weight="fill" />
              </div>
              <h2 className="mt-5 font-display text-2xl font-bold tracking-tight">{b.name}</h2>
              <p className="mt-2 text-sm text-neutral-600">{b.tagline}</p>
              <div
                className="mt-6 inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold text-white transition-transform group-hover:scale-[1.03]"
                style={{ backgroundColor: b.color, color: b.textOn }}
              >
                Get {b.name} help <ArrowRight size={16} weight="bold" />
              </div>
            </Link>
          ))}
        </div>

        {/* Reassurance strip */}
        <div className="mx-auto mt-14 grid max-w-4xl gap-4 sm:grid-cols-3">
          {[
            { icon: <Clock size={22} weight="duotone" className="text-neutral-900" />, t: "5–15 min response", d: "Our team replies fast during business hours." },
            { icon: <ShieldCheck size={22} weight="duotone" className="text-neutral-900" />, t: "Free assistance", d: "Activation help is free for keys bought from us." },
            { icon: <Headset size={22} weight="duotone" className="text-neutral-900" />, t: "Real humans", d: "Step-by-step guidance until you're protected." },
          ].map((x, i) => (
            <div key={i} className="rounded-xl border border-neutral-200 bg-white p-5 text-center">
              <div className="mx-auto grid h-11 w-11 place-items-center rounded-lg bg-neutral-100">{x.icon}</div>
              <div className="mt-3 font-display font-semibold">{x.t}</div>
              <p className="mt-1 text-sm text-neutral-600">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      <BrandDisclaimer />
    </div>
  );
}
