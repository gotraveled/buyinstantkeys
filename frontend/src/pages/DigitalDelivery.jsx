import PolicyLayout, { Section } from "@/components/PolicyLayout";

const SECTIONS = [
  { id: "overview", title: "1. What is digital delivery?" },
  { id: "process", title: "2. Our delivery process" },
  { id: "timing", title: "3. Delivery timing" },
  { id: "what-you-receive", title: "4. What you'll receive" },
  { id: "activation", title: "5. Activating your license" },
  { id: "no-shipping", title: "6. No physical shipping" },
  { id: "delivery-failure", title: "7. If delivery fails" },
  { id: "international", title: "8. International customers" },
  { id: "environment", title: "9. Environmental impact" },
  { id: "contact", title: "10. Contact" },
];

export default function DigitalDelivery() {
  return (
    <PolicyLayout
      title="How Digital Delivery Works"
      subtitle="Everything you need to know about how BuyInstantKeys delivers Norton license keys electronically — instantly and safely."
      lastUpdated="February 1, 2026"
      sections={SECTIONS}
    >
      <Section id="overview" title="1. What is digital delivery?">
        <p>Digital delivery means your Norton license key is sent to you electronically — <strong>by email</strong> — instead of being shipped as a physical product. There are no CDs, no boxes, no packing slips, and no waiting for a courier. You receive a unique 25-character activation code that unlocks your Norton subscription on the official Norton portal.</p>
        <p>This method is faster, safer, and better for the environment. It is the same method Norton and other software publishers use today. Physical retail boxes of Norton have been largely discontinued — even when you buy from a physical store, you receive a code printed inside a small card.</p>
      </Section>

      <Section id="process" title="2. Our delivery process — step by step">
        <ol className="list-decimal pl-6">
          <li><strong>You place your order</strong> — choose a Norton product on our Site and complete checkout with your name, email, phone, billing address, and PayPal payment.</li>
          <li><strong>Payment is verified</strong> — our system automatically confirms your PayPal payment. This usually takes seconds.</li>
          <li><strong>Fraud review</strong> — our activation team reviews every order manually to prevent fraud and protect both you and the publisher. This step typically takes 3–10 minutes.</li>
          <li><strong>License is assigned</strong> — a genuine, unused Norton product key from our verified inventory is assigned to your order.</li>
          <li><strong>Email is dispatched</strong> — you receive an email at the address you provided at checkout containing your license key, activation link, and step-by-step activation instructions.</li>
          <li><strong>You activate</strong> — you sign in to my.norton.com, enter the 25-character key, and download Norton to your device. Total time: usually under 10 minutes.</li>
        </ol>
      </Section>

      <Section id="timing" title="3. Delivery timing">
        <p><strong>Standard delivery: 5 to 15 minutes</strong> after payment confirmation.</p>
        <p>Almost all orders are delivered within this window. Delivery may take longer in these situations:</p>
        <ul className="list-disc pl-6">
          <li>Weekends and public holidays (up to 4 hours)</li>
          <li>High-risk transactions flagged by our fraud prevention system (up to 24 hours while we manually verify)</li>
          <li>PayPal payment holds or eCheck payments (until PayPal confirms funds)</li>
          <li>Rare inventory delays for specific tiers (we will notify you if this affects your order)</li>
        </ul>
        <p>If your license key has not arrived within 24 hours of payment, please first check your <strong>spam / junk folder</strong> and then contact us. We track every delivery and can resend the email if needed.</p>
      </Section>

      <Section id="what-you-receive" title="4. What you'll receive">
        <p>Your delivery email will contain:</p>
        <ul className="list-disc pl-6">
          <li>Your <strong>order number</strong> for reference</li>
          <li>The <strong>Norton product</strong> and <strong>plan</strong> you purchased (e.g., "Norton 360 Deluxe — 5 devices / 1 year")</li>
          <li>Your unique <strong>25-character license key</strong> in the format <code className="font-mono">XXXXX-XXXXX-XXXXX-XXXXX-XXXXX</code></li>
          <li>A direct link to <strong>my.norton.com</strong> for redemption</li>
          <li>Clear <strong>step-by-step activation instructions</strong> for Windows, macOS, iOS, and Android</li>
          <li>Our support contact for any questions or activation help</li>
        </ul>
        <p>All keys sold by BuyInstantKeys are <strong>genuine, unused, and legally acquired from authorized channels</strong>. Each key is verified before delivery.</p>
      </Section>

      <Section id="activation" title="5. Activating your license">
        <p>Activation is quick and straightforward:</p>
        <ol className="list-decimal pl-6">
          <li>Open the activation email from BuyInstantKeys and copy your 25-character key.</li>
          <li>Go to <a href="https://my.norton.com" target="_blank" rel="noopener noreferrer" className="underline">my.norton.com</a> and sign in (or create a free Norton account if you don't already have one — you'll need one to manage your subscription).</li>
          <li>Click <strong>"Enter a new product key"</strong>, paste your key, and click <strong>Continue</strong>.</li>
          <li>Follow the on-screen prompts to download and install Norton on your first device.</li>
          <li>Repeat the download step on additional devices (up to the number allowed by your plan).</li>
        </ol>
        <p>Need help? Our free Activation Portal at <a href="/activation" className="underline">buyinstantkeys.com/activation</a> gives you step-by-step guidance, and our support team is available 24/7 at <a href="mailto:info@buyinstantkeys.com" className="underline">info@buyinstantkeys.com</a>.</p>
      </Section>

      <Section id="no-shipping" title="6. No physical shipping">
        <p>Because your Norton license is delivered by email as a digital code, <strong>there is no physical shipping and no shipping fees</strong>. You will not receive a physical box, CD, USB drive, or printed receipt. If you require a printable receipt for your records, your order confirmation email serves as one.</p>
      </Section>

      <Section id="delivery-failure" title="7. If delivery fails or is delayed">
        <p>If you don't see your delivery email within 24 hours after payment:</p>
        <ol className="list-decimal pl-6">
          <li><strong>Check your spam / junk / promotions folder.</strong> Email from an unfamiliar sender often lands there.</li>
          <li><strong>Search your inbox</strong> for "BuyInstantKeys" or "Norton" or your order number (starts with BIK-).</li>
          <li><strong>Whitelist</strong> our sending domain to prevent future emails from being filtered.</li>
          <li><strong>Track your order</strong> on our <a href="/track" className="underline">Track Order</a> page — you'll see current status and the license key if it has been delivered.</li>
          <li><strong>Contact support</strong> at <a href="mailto:info@buyinstantkeys.com" className="underline">info@buyinstantkeys.com</a> with your order number — we will resend or issue a full refund if needed.</li>
        </ol>
        <p>We will never share your license key with anyone other than the email address on your order. This is why entering the correct email at checkout is important.</p>
      </Section>

      <Section id="international" title="8. International customers">
        <p>Because delivery is digital, BuyInstantKeys serves customers worldwide. Your Norton license is region-appropriate and works on your device wherever you are. All prices are displayed in USD. Your bank or PayPal will convert the amount to your local currency at the current exchange rate; conversion fees may apply, depending on your card issuer.</p>
      </Section>

      <Section id="environment" title="9. Environmental impact">
        <p>Digital delivery eliminates the environmental cost of manufacturing, packaging, and transporting physical software boxes. We estimate that each digital delivery saves approximately 200g of CO₂ compared to a shipped retail box. It's a small choice with a real cumulative benefit.</p>
      </Section>

      <Section id="contact" title="10. Contact">
        <p className="rounded-md border border-neutral-200 bg-neutral-50 p-3 font-medium text-neutral-800">
          <strong>BuyInstantKeys — Delivery Team</strong><br />
          Westwood Street, Hayward, California, 94544, USA<br />
          Email: <a href="mailto:info@buyinstantkeys.com" className="underline">info@buyinstantkeys.com</a>
        </p>
      </Section>
    </PolicyLayout>
  );
}
