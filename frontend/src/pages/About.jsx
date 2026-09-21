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
      "description": "An independent digital software reseller providing genuine Norton, Webroot and McAfee license keys — delivered fast, priced fairly, backed by responsive customer service.",
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
        title="About Us | BuyInstantKeys - Independent Antivirus Reseller"
        description="Learn about BuyInstantKeys - your trusted source for genuine Norton, Webroot and McAfee license keys. Independent reseller with fast delivery, fair prices, and responsive customer service."
        keywords="About BuyInstantKeys, antivirus reseller, license keys company, genuine software seller, Norton Webroot McAfee keys"
        schema={[aboutSchema]}
      />
      <PolicyLayout
        title="About BuyInstantKeys"
        subtitle="An independent digital software reseller providing genuine Norton, Webroot and McAfee license keys — delivered fast, priced fairly, backed by responsive customer service."
        lastUpdated="February 1, 2026"
        sections={SECTIONS}
      >
      <Section id="mission" title="Our mission">
        <p>BuyInstantKeys was founded on a simple idea: <strong>cybersecurity should be affordable and easy to access for everyone.</strong></p>
        <p>Retail-priced antivirus subscriptions have become expensive, and the checkout experience on many publisher sites is designed to upsell — not to serve. We built BuyInstantKeys to give consumers a straightforward alternative: legitimate license keys for leading antivirus brands, at fair prices, delivered by email within minutes, backed by responsive customer service if anything goes wrong.</p>
      </Section>

      <Section id="story" title="Our story">
        <p>BuyInstantKeys was founded in Hayward, California by a small team of software resellers and customer-experience professionals who had spent years watching friends and family struggle with confusing renewal notices, surprise price increases, and overwhelming installer flows for major security products.</p>
        <p>We sourced our first inventory of genuine keys from trusted digital channels and started small — one product, one delivery flow, one email contact inbox. Today, we carry three of the most trusted names in consumer security — Norton, Webroot and McAfee — spanning antivirus, internet security suites, VPN, identity protection and more, and we serve customers worldwide.</p>
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
            <div className="mt-3 font-display font-semibold">Real service</div>
            <p className="mt-1 text-sm text-neutral-700">A real person answers every inquiry. We reply within 12 hours and stay with you until your key is activated.</p>
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
          <li>Genuine license keys sourced from trusted digital channels</li>
          <li>Digital delivery by email within 5–15 minutes of payment confirmation</li>
          <li>Secure PayPal checkout — we never see or store your card details</li>
          <li>Activation service through our <a href="/activation" className="underline">Activation Portal</a></li>
          <li>30-day money-back guarantee</li>
          <li>Responsive customer service (info@buyinstantkeys.com)</li>
          <li>Three trusted brands — Norton, Webroot and McAfee — covering antivirus, internet security, VPN and identity protection</li>
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
        <p>For product questions, order inquiries, activation service, refund requests, media & press, or legal notices, please email us at the address above. We aim to respond to every message within 12 hours.</p>
      </Section>
    </PolicyLayout>
    </>
  );
}
