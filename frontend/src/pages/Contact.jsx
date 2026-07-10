import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import SEO from "@/components/SEO";
import { Envelope, ChatCircle, MapPin, Phone } from "@phosphor-icons/react";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "", honeypot: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formStartTime] = useState(Date.now());
  
  const submit = async (e) => {
    e.preventDefault();
    
    // Honeypot check - if filled, it's a bot
    if (form.honeypot) {
      toast.error("Submission failed", { description: "Please try again." });
      return;
    }
    
    // Time-based check - must take at least 3 seconds to submit
    const timeElapsed = Date.now() - formStartTime;
    if (timeElapsed < 3000) {
      toast.error("Please slow down", { description: "Submit too quickly. Please wait and try again." });
      return;
    }
    
    // Basic spam pattern detection
    const spamPatterns = [
      /http/i,
      /www\./i,
      /\.com/i,
      /\.org/i,
      /\.net/i,
      /viagra/i,
      /casino/i,
      /bitcoin/i,
      /crypto/i,
      /investment/i,
      /loan/i,
      /credit/i,
      /debt/i
    ];
    
    const messageLower = form.message.toLowerCase();
    const isSpam = spamPatterns.some(pattern => pattern.test(messageLower));
    
    if (isSpam) {
      toast.error("Message blocked", { description: "Your message appears to contain spam content." });
      return;
    }
    
    setSubmitting(true);
    try {
      await api.post("/contact", { name: form.name, email: form.email, message: form.message });
      toast.success("Message sent!", { description: "We'll reply within 12 hours." });
      setForm({ name: "", email: "", message: "", honeypot: "" });
    } catch (error) {
      toast.error("Failed to send message", { description: "Please try again later." });
    } finally {
      setSubmitting(false);
    }
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
          {/* Honeypot field - hidden from users but visible to bots */}
          <div style={{ display: 'none' }}>
            <label htmlFor="honeypot">Leave this field empty</label>
            <input
              id="honeypot"
              type="text"
              value={form.honeypot}
              onChange={(e) => setForm({ ...form, honeypot: e.target.value })}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>
          
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
          <button data-testid="contact-submit-btn" type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Sending..." : "Send message"}
          </button>
        </form>
        
        {/* SEO Content */}
        <div className="mt-16 rounded-xl border border-neutral-200 bg-neutral-50 p-8">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Why Contact Us?</div>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">Expert Norton activation assistance</h2>
          
          <div className="mt-6 space-y-4 text-neutral-700">
            <p>
              Our team specializes in Norton activation and provides expert guidance for all Norton products. Whether you need help with Norton 360 Deluxe with LifeLock, Norton 360 Premium, or Norton AntiVirus Plus, we're here to assist you with activation, installation, and troubleshooting.
            </p>
            
            <h3 className="font-display text-lg font-semibold text-neutral-900">Common reasons to contact us:</h3>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Norton product key activation assistance</li>
              <li>Installation guidance for Norton software</li>
              <li>Troubleshooting Norton subscription issues</li>
              <li>Order status and delivery inquiries</li>
              <li>Refund and replacement requests</li>
              <li>Product recommendations and upgrades</li>
              <li>Multi-device activation support</li>
            </ul>
            
            <p>
              We respond to all inquiries within 12 hours, with most issues resolved on the same day. Our team has extensive experience with Norton products and can help you get your devices protected quickly and efficiently.
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
