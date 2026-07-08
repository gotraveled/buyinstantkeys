import PolicyLayout, { Section } from "@/components/PolicyLayout";
import SEO from "@/components/SEO";

const SECTIONS = [
  { id: "overview", title: "1. Overview" },
  { id: "guarantee", title: "2. 30-day money-back guarantee" },
  { id: "eligibility", title: "3. Refund eligibility" },
  { id: "non-refundable", title: "4. Non-refundable situations" },
  { id: "process", title: "5. How to request a refund" },
  { id: "timeline", title: "6. Refund processing timeline" },
  { id: "method", title: "7. Refund method" },
  { id: "consumer-rights", title: "8. Statutory consumer rights" },
  { id: "chargebacks", title: "9. Chargebacks" },
  { id: "contact", title: "10. Contact" },
];

export default function RefundPolicy() {
  return (
    <>
      <SEO
        title="Refund Policy | BuyInstantKeys - 30 Day Money Back Guarantee"
        description="Read BuyInstantKeys refund policy. 30-day money-back guarantee for Norton license keys. Easy refund process if your key doesn't work."
        keywords="BuyInstantKeys refund policy, Norton key refund, 30 day money back guarantee, Norton license refund, money back guarantee, refund process"
      />
      <PolicyLayout
        title="Refund Policy"
        subtitle="We stand behind every Norton license we sell. If something goes wrong, we make it right."
        lastUpdated="February 1, 2026"
        sections={SECTIONS}
      >
      <Section id="overview" title="1. Overview">
        <p>At BuyInstantKeys, customer satisfaction is our top priority. This Refund Policy explains when and how you may request a refund for digital License keys purchased through our website at buyinstantkeys.com. This policy is part of our <a href="/terms" className="underline">Terms and Conditions</a>.</p>
        <p>Because Products sold on our Site are digital License keys (not physical goods), refund conditions are specific to the nature of software licenses. Please read this policy carefully before placing an Order.</p>
      </Section>

      <Section id="guarantee" title="2. 30-day money-back guarantee">
        <p>We offer a <strong>30-day money-back guarantee</strong> from the date of purchase for License keys that:</p>
        <ul className="list-disc pl-6">
          <li>Fail to activate on the Publisher's official activation portal (e.g., my.norton.com) through no fault of the customer</li>
          <li>Are found to have been previously redeemed by another user</li>
          <li>Do not match the product or plan you ordered (e.g., wrong tier delivered)</li>
        </ul>
        <p>To qualify, the refund request must be submitted within 30 days of the Order date and must include the Order number, the email address used at checkout, and a clear description of the issue with any relevant screenshots.</p>
      </Section>

      <Section id="eligibility" title="3. Refund eligibility">
        <p>You may be eligible for a full refund if:</p>
        <ul className="list-disc pl-6">
          <li>The License key cannot be redeemed on the Publisher's activation portal, and our team confirms the issue</li>
          <li>You purchased the wrong product by accident and have <strong>not</strong> yet activated the License</li>
          <li>You did not receive your License key within 24 hours of payment confirmation (subject to our verification)</li>
          <li>You are protected by an applicable statutory right to cancel (see Section 8)</li>
        </ul>
        <p>Partial refunds may be issued in exceptional situations at our sole discretion.</p>
      </Section>

      <Section id="non-refundable" title="4. Non-refundable situations">
        <p>Refunds will not be issued in the following situations:</p>
        <ul className="list-disc pl-6">
          <li>The License key has been <strong>successfully activated and used</strong> and more than 14 days have passed since activation</li>
          <li>The refund request is submitted more than 30 days after the Order date</li>
          <li>The customer has violated our <a href="/terms" className="underline">Terms and Conditions</a>, including any fraudulent use, chargeback abuse, or prohibited conduct</li>
          <li>The customer changed their mind after using the License (subjective dissatisfaction with features that are clearly described on our Site or on the Publisher's website)</li>
          <li>The customer's device does not meet the Publisher's stated system requirements</li>
        </ul>
      </Section>

      <Section id="process" title="5. How to request a refund">
        <p>To request a refund, follow these steps:</p>
        <ol className="list-decimal pl-6">
          <li>Email us at <a href="mailto:info@buyinstantkeys.com" className="underline">info@buyinstantkeys.com</a> with the subject line "Refund Request — [Order Number]"</li>
          <li>Include your full name, the email used at checkout, and the Order number</li>
          <li>Describe the issue in detail. Attach screenshots if available (e.g., the error message from Norton's activation page)</li>
          <li>Do NOT initiate a chargeback with your bank before contacting us — chargebacks make refund resolution slower and may result in account suspension</li>
        </ol>
        <p>We will acknowledge your request within 24 hours (business days) and provide a resolution within 3–5 business days.</p>
      </Section>

      <Section id="timeline" title="6. Refund processing timeline">
        <ul className="list-disc pl-6">
          <li><strong>Acknowledgement:</strong> within 24 business hours</li>
          <li><strong>Review & decision:</strong> up to 3–5 business days</li>
          <li><strong>Refund initiation:</strong> once approved, within 2 business days</li>
          <li><strong>Funds credited back:</strong> 3–10 business days depending on your bank / PayPal balance settlement</li>
        </ul>
      </Section>

      <Section id="method" title="7. Refund method">
        <p>Refunds are issued using the same payment method used for the original Order. If you paid via PayPal, the refund will be credited to the same PayPal account or the underlying funding source. We do not offer refunds via cash, check, bank transfer, or store credit unless the original payment method is no longer available.</p>
      </Section>

      <Section id="consumer-rights" title="8. Statutory consumer rights">
        <p><strong>California residents:</strong> Nothing in this Refund Policy limits your rights under the California Consumers Legal Remedies Act or other applicable California law.</p>
        <p><strong>EU/UK residents:</strong> If you are a consumer resident in the European Union, United Kingdom, or Switzerland, you may have a 14-day right of withdrawal for distance contracts. However, this right does not apply to digital content once delivery has begun with your express prior consent — which is the case with digital License keys delivered by email. By completing checkout and clicking to receive the License key immediately, you expressly acknowledge that your right of withdrawal is waived once the key is delivered.</p>
      </Section>

      <Section id="chargebacks" title="9. Chargebacks">
        <p>If you dispute a charge with your bank or PayPal without first contacting us to resolve the issue, we consider this a chargeback. Chargebacks are costly and time-consuming for both parties. We reserve the right to:</p>
        <ul className="list-disc pl-6">
          <li>Contest any chargeback we believe is unwarranted, with full evidence including your order confirmation, IP logs, and License delivery records</li>
          <li>Suspend your account and revoke any active License keys</li>
          <li>Add your email to our internal fraud prevention list to prevent future orders</li>
        </ul>
      </Section>

      <Section id="contact" title="10. Contact">
        <p className="rounded-md border border-neutral-200 bg-neutral-50 p-3 font-medium text-neutral-800">
          <strong>BuyInstantKeys — Refunds Team</strong><br />
          Westwood Street, Hayward, California, 94544, USA<br />
          Email: <a href="mailto:info@buyinstantkeys.com" className="underline">info@buyinstantkeys.com</a>
        </p>
      </Section>
    </PolicyLayout>
    </>
  );
}
