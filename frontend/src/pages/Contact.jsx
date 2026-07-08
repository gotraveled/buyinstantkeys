import { useState } from "react";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import { Envelope, ChatCircle, MapPin, Phone } from "@phosphor-icons/react";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const submit = (e) => {
    e.preventDefault();
    toast.success("Message sent!", { description: "We'll reply within 12 hours." });
    setForm({ name: "", email: "", message: "" });
  };

  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "mainEntity": {
      "@type": "Organization",
      "name": "BuyInstantKeys",
      "url": "https://buyinstantkeys.com",
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+1-510-555-0123",
        "contactType": "customer service",
        "email": "info@buyinstantkeys.com",
        "availableLanguage": "English",
        "areaServed": "US"
      },
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
        title="Contact Us | BuyInstantKeys"
        description="Get in touch with BuyInstantKeys for Norton license key inquiries, order assistance, and activation help. We respond within 12 hours."
        keywords="Contact BuyInstantKeys, Norton customer service, Norton key assistance, order inquiry, activation help, Norton contact"
        schema={[contactSchema]}
      />
      <div className="container-page py-14">
      <div className="mx-auto max-w-4xl">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Contact</div>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">We're here to help</h1>
        <p className="mt-3 text-neutral-600">Have a question about your order or Norton products? Send us a message — we usually reply within 12 hours.</p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            <Envelope size={22} weight="duotone" />
            <div className="mt-3 font-display font-semibold">Email us</div>
            <a href="mailto:info@buyinstantkeys.com" className="text-sm text-neutral-600 hover:text-neutral-900">info@buyinstantkeys.com</a>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            <MapPin size={22} weight="duotone" />
            <div className="mt-3 font-display font-semibold">Visit us</div>
            <div className="text-sm text-neutral-600">Westwood Street,<br />Hayward, California, 94544<br />United States</div>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-neutral-900 p-6 text-white">
            <div className="text-[#FCE029]"><ChatCircle size={22} weight="duotone" /></div>
            <div className="mt-3 font-display font-semibold">Response time</div>
            <div className="text-sm text-neutral-300">Under 12 hours guaranteed. Live chat Mon–Fri 9am–9pm UTC.</div>
          </div>
        </div>

        <form onSubmit={submit} className="mt-10 space-y-4 rounded-xl border border-neutral-200 bg-white p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-600">Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="contact-name-input" className="mt-1 w-full rounded-md border border-neutral-300 px-4 py-3 text-sm focus:border-yellow-500 focus:ring-2 focus:ring-yellow-400" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-600">Email</label>
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="contact-email-input" className="mt-1 w-full rounded-md border border-neutral-300 px-4 py-3 text-sm focus:border-yellow-500 focus:ring-2 focus:ring-yellow-400" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-600">Message</label>
            <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} data-testid="contact-message-input" className="mt-1 w-full rounded-md border border-neutral-300 px-4 py-3 text-sm focus:border-yellow-500 focus:ring-2 focus:ring-yellow-400" />
          </div>
          <button data-testid="contact-submit-btn" type="submit" className="btn-primary">Send message</button>
        </form>
      </div>
    </div>
    </>
  );
}
