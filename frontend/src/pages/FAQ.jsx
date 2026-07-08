import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import SEO from "@/components/SEO";

const faqs = [
  { q: "How long until I receive my license key?", a: "Most orders are delivered within 5–15 minutes after payment. Our team manually verifies each payment to prevent fraud. You'll get an email once your key is ready." },
  { q: "Are these Norton keys genuine?", a: "Yes. Every license key we sell is 100% genuine and sourced from trusted partners. You activate on Norton's official site." },
  { q: "How do I activate my Norton key?", a: "Sign in to my.norton.com (or create an account), click 'Enter a new product key', paste your key, and download Norton for your device." },
  { q: "What if my key doesn't work?", a: "Contact us right away — we'll replace the key or provide a full refund within 30 days of purchase." },
  { q: "Can I use one key on multiple devices?", a: "Yes, depending on the plan you purchase. For example, Norton 360 Deluxe covers up to 5 devices, Norton 360 Premium covers up to 10." },
  { q: "Do you offer refunds?", a: "Yes, we offer a 30-day money-back guarantee if you can't activate your key or aren't satisfied." },
  { q: "Is my payment secure?", a: "All payments are processed through PayPal's secure, encrypted platform. We never see or store your card details." },
  { q: "Do I need to create an account?", a: "No. You can check out as a guest — we only need your email to deliver the key." },
];

export default function FAQ() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a
      }
    }))
  };

  return (
    <>
      <SEO
        title="Frequently Asked Questions | BuyInstantKeys"
        description="Find answers to common questions about buying Norton license keys, activation, refunds, and more. Get instant help with your Norton software purchase."
        keywords="Norton FAQ, Norton license key questions, Norton activation help, Norton refund policy, Norton 360 questions, how to activate Norton, Norton key not working"
        schema={[faqSchema]}
      />
      <div className="container-page py-14">
      <div className="mx-auto max-w-3xl">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Resources</div>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Frequently asked questions</h1>
        <p className="mt-3 text-neutral-600">Everything you need to know about buying Norton keys from us.</p>

        <Accordion type="single" collapsible className="mt-8 divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-0 px-6">
              <AccordionTrigger data-testid={`faq-trigger-${i}`} className="text-left font-display text-base font-semibold hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-neutral-600">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
    </>
  );
}
