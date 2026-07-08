import PolicyLayout, { Section } from "@/components/PolicyLayout";
import SEO from "@/components/SEO";
import { ShieldCheck, Envelope, MapPin, Users, Trophy, Handshake } from "@phosphor-icons/react";

const SECTIONS = [
  { id: "mission", title: "Our mission" },
  { id: "story", title: "Our story" },
  { id: "values", title: "Our values" },
  { id: "how-we-work", title: "How we work" },
  { id: "why-us", title: "Why choose BuyInstantKeys" },
  { id: "contact", title: "Contact us" },
];

export default function About() {
  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "mainEntity": {
      "@type": "Organization",
      "name": "BuyInstantKeys",
      "url": "https://buyinstantkeys.com",
      "description": "An independent digital software reseller helping customers protect their devices with genuine Norton license keys — delivered fast, priced fairly, backed by real human assistance.",
      "foundingDate": "2024",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Westwood Street",
        "addressLocality": "Hayward",
        "addressRegion": "CA",
        "postalCode": "94544",
        "addressCountry": "US"
      }
    }
  };

  return (
    <>
      <SEO
        title="About Us | BuyInstantKeys - Trusted Norton Reseller"
        description="Learn about BuyInstantKeys - your trusted source for genuine Norton license keys. Independent reseller with instant delivery, fair prices, and real human assistance."
        keywords="About BuyInstantKeys, Norton reseller, Norton license keys company, genuine Norton software seller, Norton key delivery service"
        schema={[aboutSchema]}
      />
      <PolicyLayout
        title="About BuyInstantKeys"
        subtitle="An independent digital software reseller helping customers protect their devices with genuine Norton license keys — delivered fast, priced fairly, backed by real human assistance."
        lastUpdated="February 1, 2026"
        sections={SECTIONS}
      >
      <Section id="mission" title="Our mission">
        <p>BuyInstantKeys was founded on a simple idea: <strong>cybersecurity should be affordable and easy to access for everyone.</strong></p>
        <p>Retail-priced antivirus subscriptions have become expensive, and the checkout experience on many publisher sites is designed to upsell — not to help. We built BuyInstantKeys to give consumers a straightforward alternative: legitimate Norton license keys, at fair prices, delivered by email within minutes, backed by responsive human assistance if anything goes wrong.</p>
      </Section>

      <Section id="story" title="Our story">
        <p>BuyInstantKeys was founded in Hayward, California by a small team of software resellers and customer-experience professionals who had spent years watching friends and family struggle with confusing renewal notices, surprise price increases, and overwhelming installer flows for Norton and other security products.</p>
        <p>We sourced our first inventory of genuine keys from trusted digital channels and started small — one product, one delivery flow, one email contact inbox. Today, we carry the full Norton catalog including Norton 360 (Standard, Deluxe, Premium, Advanced), Norton with LifeLock (Select, Select Plus, Advantage, Ultimate Plus), Norton VPN, Norton AntiTrack, Norton Utilities Ultimate, Norton Family, Norton Small Business, Norton Mobile Security, Norton Password Manager and more — and we have served thousands of customers worldwide.</p>
      </Section>

      <Section id="values" title="Our values">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5">
            <ShieldCheck size={22} weight="duotone" className="text-neutral-900" />
            <div className="mt-3 font-display font-semibold">Authenticity</div>
            <p className="mt-1 text-sm text-neutral-700">Every key we sell is genuine and sourced from trusted digital channels — never grey-market or stolen.</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5">
            <Users size={22} weight="duotone" className="text-neutral-900" />
            <div className="mt-3 font-display font-semibold">Real assistance</div>
            <p className="mt-1 text-sm text-neutral-700">A real human answers every inquiry. We reply within 12 hours and stay with you until your key is activated.</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5">
            <Handshake size={22} weight="duotone" className="text-neutral-900" />
            <div className="mt-3 font-display font-semibold">Transparency</div>
            <p className="mt-1 text-sm text-neutral-700">Clear pricing, clear refund policy, and a public independent-reseller disclaimer on every page.</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5">
            <Trophy size={22} weight="duotone" className="text-neutral-900" />
            <div className="mt-3 font-display font-semibold">Fair value</div>
            <p className="mt-1 text-sm text-neutral-700">We negotiate volume pricing with our supply partners and pass most of the savings on to you.</p>
          </div>
        </div>
      </Section>

      <Section id="how-we-work" title="How we work">
        <p>We are a lean company. Every dollar we don't spend on advertising or overhead is a dollar we can pass back to customers as lower prices. Our operational focus is on three things: sourcing genuine license inventory, keeping the buying experience simple, and answering inquiries within hours (not days).</p>
        <p>All orders are personally reviewed by our activation team before delivery. This step catches fraud early and ensures every customer receives a working key. It is why we can offer a 30-day money-back guarantee with confidence.</p>
      </Section>

      <Section id="why-us" title="Why choose BuyInstantKeys">
        <ul className="list-disc pl-6">
          <li>Save up to 70% off Norton's manufacturer suggested retail price</li>
          <li>Genuine license keys sourced from trusted digital channels</li>
          <li>Digital delivery by email within 5–15 minutes of payment confirmation</li>
          <li>Secure PayPal checkout — we never see or store your card details</li>
          <li>Free activation help through our <a href="/activation" className="underline">Activation Portal</a></li>
          <li>30-day money-back guarantee</li>
          <li>Responsive human assistance (info@buyinstantkeys.com)</li>
          <li>Full range of Norton products — Norton 360, LifeLock, VPN, AntiTrack, Family, Small Business and more</li>
        </ul>
      </Section>

      <Section id="contact" title="Contact us">
        <p className="rounded-md border border-neutral-200 bg-neutral-50 p-3 font-medium text-neutral-800">
          <MapPin size={16} weight="duotone" className="mr-1 inline align-text-bottom" />
          BuyInstantKeys<br />
          Westwood Street, Hayward, California, 94544, USA<br />
          <Envelope size={16} weight="duotone" className="mr-1 inline align-text-bottom" />
          <a href="mailto:info@buyinstantkeys.com" className="underline">info@buyinstantkeys.com</a>
        </p>
        <p>For product questions, order inquiries, activation help, refund requests, media & press, or legal notices, please email us at the address above. We aim to respond to every message within 12 hours.</p>
      </Section>
    </PolicyLayout>
    </>
  );
}
