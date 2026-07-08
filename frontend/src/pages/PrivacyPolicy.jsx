import PolicyLayout, { Section } from "@/components/PolicyLayout";
import SEO from "@/components/SEO";

const SECTIONS = [
  { id: "intro", title: "1. Introduction" },
  { id: "who-we-are", title: "2. Who we are" },
  { id: "info-we-collect", title: "3. Information we collect" },
  { id: "how-we-use", title: "4. How we use your information" },
  { id: "legal-basis", title: "5. Legal basis for processing" },
  { id: "sharing", title: "6. How we share your information" },
  { id: "cookies", title: "7. Cookies & tracking technologies" },
  { id: "retention", title: "8. Data retention" },
  { id: "rights", title: "9. Your privacy rights" },
  { id: "children", title: "10. Children's privacy" },
  { id: "international", title: "11. International data transfers" },
  { id: "security", title: "12. Data security" },
  { id: "california", title: "13. California residents (CCPA)" },
  { id: "eu", title: "14. EU/UK residents (GDPR)" },
  { id: "changes", title: "15. Changes to this policy" },
  { id: "contact", title: "16. Contact us" },
];

export default function PrivacyPolicy() {
  return (
    <>
      <SEO
        title="Privacy Policy | BuyInstantKeys"
        description="Read BuyInstantKeys privacy policy. Learn how we collect, use, and protect your personal information when purchasing Norton license keys."
        keywords="BuyInstantKeys privacy policy, data protection, personal information security, Norton key purchase privacy, customer data protection"
      />
      <PolicyLayout
        title="Privacy Policy"
        subtitle="How we collect, use, and protect your personal information when you purchase Norton license keys from BuyInstantKeys."
        lastUpdated="February 1, 2026"
        sections={SECTIONS}
      >
      <Section id="intro" title="1. Introduction">
        <p>BuyInstantKeys ("we", "our", "us", "the Company") is committed to protecting the privacy of our customers, visitors, and users of our website located at buyinstantkeys.com (the "Site"). This Privacy Policy explains what personal information we collect, how we use and share that information, and the rights you have regarding your personal data.</p>
        <p>By accessing or using the Site, submitting an order, or otherwise providing us with your personal information, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree with our policies and practices, do not use the Site.</p>
      </Section>

      <Section id="who-we-are" title="2. Who we are">
        <p>BuyInstantKeys is a digital software reseller registered in the United States. Our business address is:</p>
        <p className="rounded-md border border-neutral-200 bg-neutral-50 p-3 font-medium text-neutral-800">
          BuyInstantKeys<br />
          Westwood Street, Hayward, California, 94544<br />
          United States<br />
          Email: <a href="mailto:info@buyinstantkeys.com" className="underline">info@buyinstantkeys.com</a>
        </p>
        <p>We are the data controller responsible for your personal information collected through this Site.</p>
      </Section>

      <Section id="info-we-collect" title="3. Information we collect">
        <p>We collect several categories of information from and about you:</p>
        <p><strong>Information you provide directly:</strong></p>
        <ul className="list-disc pl-6">
          <li>Full name, email address, phone number, and billing address (collected at checkout)</li>
          <li>Order details, product selections, and shopping cart contents</li>
          <li>License activation information (Norton product key, customer name, email) submitted through our Activation Portal</li>
          <li>Communications you send us (inquiries, contact form messages, email correspondence)</li>
          <li>Account credentials if you create an admin account</li>
        </ul>
        <p><strong>Information collected automatically:</strong></p>
        <ul className="list-disc pl-6">
          <li>IP address, browser type and version, operating system, referring URL, and pages visited</li>
          <li>Device information (device type, screen size, unique device identifiers)</li>
          <li>Cookies and similar technologies (see Section 7)</li>
          <li>Usage data (time spent on pages, clicks, scroll depth) via analytics tools</li>
        </ul>
        <p><strong>Information from third parties:</strong></p>
        <ul className="list-disc pl-6">
          <li>Payment confirmation details from PayPal (we do NOT receive or store your full card or bank account information)</li>
          <li>Email delivery status from our email service provider (Resend)</li>
          <li>Fraud prevention signals from payment processors</li>
        </ul>
      </Section>

      <Section id="how-we-use" title="4. How we use your information">
        <p>We use the personal information we collect for the following purposes:</p>
        <ul className="list-disc pl-6">
          <li><strong>Order fulfillment:</strong> to process your purchase, deliver license keys to your email, verify payment, and issue refunds when applicable</li>
          <li><strong>Customer service:</strong> to respond to your inquiries, provide activation assistance, and resolve issues</li>
          <li><strong>Communication:</strong> to send order confirmations, delivery notifications, activation instructions, and important account or service announcements</li>
          <li><strong>Fraud prevention & security:</strong> to detect, investigate and prevent fraudulent transactions, chargebacks, and abuse of our services</li>
          <li><strong>Service improvement:</strong> to analyze usage patterns, improve website functionality, product offerings, and customer experience</li>
          <li><strong>Marketing (only with your consent):</strong> to send promotional offers, discount codes, and product recommendations. You can unsubscribe at any time by clicking the unsubscribe link in any marketing email</li>
          <li><strong>Legal compliance:</strong> to comply with applicable laws, respond to lawful requests, enforce our Terms and Conditions, and protect our rights and property</li>
        </ul>
      </Section>

      <Section id="legal-basis" title="5. Legal basis for processing (EU/UK residents)">
        <p>If you are located in the European Economic Area (EEA), the United Kingdom, or Switzerland, our legal bases for processing your personal information include:</p>
        <ul className="list-disc pl-6">
          <li><strong>Contract:</strong> processing is necessary to perform our contract with you (order fulfillment, delivery, service)</li>
          <li><strong>Legitimate interests:</strong> improving our services, preventing fraud, and understanding customer needs</li>
          <li><strong>Consent:</strong> for marketing communications and non-essential cookies (you may withdraw consent at any time)</li>
          <li><strong>Legal obligation:</strong> compliance with tax, accounting, anti-money-laundering, and consumer protection laws</li>
        </ul>
      </Section>

      <Section id="sharing" title="6. How we share your information">
        <p>We do NOT sell, rent, or trade your personal information. We share information only in the following limited situations:</p>
        <ul className="list-disc pl-6">
          <li><strong>Payment processors:</strong> PayPal, Inc. processes all payments. Your payment information is handled directly by PayPal under their own <a href="https://www.paypal.com/us/legalhub/privacy-full" target="_blank" rel="noopener noreferrer" className="underline">privacy policy</a>. We only receive a payment confirmation and transaction ID</li>
          <li><strong>Email delivery:</strong> Resend, Inc. delivers our transactional emails (order confirmations, license keys, activation communications). See <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline">Resend's privacy policy</a></li>
          <li><strong>Hosting & infrastructure:</strong> our website is hosted on secure cloud servers with industry-standard access controls and encryption at rest</li>
          <li><strong>Analytics providers:</strong> we may use privacy-friendly analytics tools that aggregate anonymized usage data</li>
          <li><strong>Legal & safety:</strong> we may disclose information to comply with a legal obligation, court order, subpoena, or to protect the rights, property, or safety of BuyInstantKeys, our customers, or others</li>
          <li><strong>Business transfers:</strong> in the event of a merger, acquisition, or sale of assets, customer information may be transferred as part of that transaction (you will be notified in advance)</li>
        </ul>
        <p><strong>We do NOT share your data with third-party advertisers for the purposes of targeted advertising without your explicit consent.</strong></p>
      </Section>

      <Section id="cookies" title="7. Cookies & tracking technologies">
        <p>We use cookies and similar technologies (localStorage, sessionStorage) to make our Site work and to improve your experience. The types of cookies we use include:</p>
        <ul className="list-disc pl-6">
          <li><strong>Strictly necessary:</strong> required to operate the Site (shopping cart persistence, session management, authentication) — cannot be disabled</li>
          <li><strong>Functional:</strong> remember your preferences (dismissed banners, applied coupon codes) to enhance usability</li>
          <li><strong>Analytics (optional):</strong> help us understand how visitors interact with the Site so we can improve it</li>
        </ul>
        <p>You can control cookies through your browser settings. Disabling essential cookies may prevent parts of the Site from functioning correctly.</p>
      </Section>

      <Section id="retention" title="8. Data retention">
        <p>We retain personal information only as long as necessary to fulfill the purposes described in this Privacy Policy, including:</p>
        <ul className="list-disc pl-6">
          <li><strong>Order records:</strong> retained for at least 7 years to comply with U.S. tax and accounting laws</li>
          <li><strong>Service communications:</strong> retained for up to 3 years for quality assurance</li>
          <li><strong>Marketing preferences:</strong> retained until you opt out</li>
          <li><strong>Website analytics:</strong> aggregated anonymized data may be retained indefinitely</li>
        </ul>
        <p>You may request earlier deletion by contacting <a href="mailto:info@buyinstantkeys.com" className="underline">info@buyinstantkeys.com</a>. We will honor such requests unless we are required to retain the data by law.</p>
      </Section>

      <Section id="rights" title="9. Your privacy rights">
        <p>Depending on your jurisdiction, you may have the following rights regarding your personal information:</p>
        <ul className="list-disc pl-6">
          <li><strong>Access:</strong> request a copy of the personal information we hold about you</li>
          <li><strong>Correction:</strong> ask us to correct inaccurate or incomplete information</li>
          <li><strong>Deletion:</strong> request that we delete your personal information (subject to legal retention obligations)</li>
          <li><strong>Restriction / objection:</strong> restrict or object to certain processing activities</li>
          <li><strong>Data portability:</strong> receive your data in a structured, commonly used format</li>
          <li><strong>Withdraw consent:</strong> withdraw consent for processing based on consent at any time</li>
          <li><strong>Complain:</strong> lodge a complaint with a supervisory authority</li>
        </ul>
        <p>To exercise these rights, email us at <a href="mailto:info@buyinstantkeys.com" className="underline">info@buyinstantkeys.com</a> with the subject line "Privacy Request". We will respond within 30 days.</p>
      </Section>

      <Section id="children" title="10. Children's privacy">
        <p>Our Site is not directed to individuals under the age of 18, and we do not knowingly collect personal information from children under 13 (or the equivalent minimum age in the relevant jurisdiction). If we learn that we have collected personal information from a child without verified parental consent, we will delete that information as quickly as possible. If you believe we might have any information from or about a child under 13, please contact us at <a href="mailto:info@buyinstantkeys.com" className="underline">info@buyinstantkeys.com</a>.</p>
      </Section>

      <Section id="international" title="11. International data transfers">
        <p>BuyInstantKeys is located in the United States. If you access our Site from outside the U.S., your personal information may be transferred to, stored, and processed in the U.S. or other countries where our service providers operate. These countries may have data protection laws different from those in your country. Where required, we implement appropriate safeguards (such as Standard Contractual Clauses) to ensure your data receives adequate protection.</p>
      </Section>

      <Section id="security" title="12. Data security">
        <p>We implement reasonable technical and organizational security measures designed to protect your personal information from unauthorized access, disclosure, alteration, and destruction. These include:</p>
        <ul className="list-disc pl-6">
          <li>HTTPS/TLS encryption of data in transit</li>
          <li>Encryption at rest for sensitive data</li>
          <li>Access controls and least-privilege principles for staff</li>
          <li>Password hashing with industry-standard algorithms (bcrypt)</li>
          <li>Regular security reviews and dependency updates</li>
        </ul>
        <p>Despite these efforts, no system can be guaranteed 100% secure. If you believe your account or information has been compromised, please contact us immediately at <a href="mailto:info@buyinstantkeys.com" className="underline">info@buyinstantkeys.com</a>.</p>
      </Section>

      <Section id="california" title="13. California residents (CCPA / CPRA)">
        <p>If you are a California resident, you have specific rights under the California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA):</p>
        <ul className="list-disc pl-6">
          <li>The right to know what personal information we collect, use, disclose, and (if applicable) sell</li>
          <li>The right to request deletion of your personal information</li>
          <li>The right to opt out of the sale or sharing of personal information — <strong>we do not sell or share personal information for cross-context behavioral advertising</strong></li>
          <li>The right to correct inaccurate personal information</li>
          <li>The right to limit the use of sensitive personal information</li>
          <li>The right to non-discrimination for exercising these rights</li>
        </ul>
        <p>To submit a CCPA/CPRA request, email <a href="mailto:info@buyinstantkeys.com" className="underline">info@buyinstantkeys.com</a> with the subject "CCPA Request".</p>
      </Section>

      <Section id="eu" title="14. EU/UK residents (GDPR)">
        <p>If you are located in the EEA, UK, or Switzerland, the General Data Protection Regulation (GDPR) applies. Our legal bases and your specific rights are described in Sections 5 and 9. You may also lodge a complaint with your local data protection authority.</p>
      </Section>

      <Section id="changes" title="15. Changes to this policy">
        <p>We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. When we make material changes, we will notify you by posting the updated policy on this page with a new "Last updated" date and, where required by law, by direct notice (such as email). We encourage you to review this Privacy Policy periodically.</p>
      </Section>

      <Section id="contact" title="16. Contact us">
        <p>For any questions, concerns, or requests related to this Privacy Policy or your personal information, please contact us:</p>
        <p className="rounded-md border border-neutral-200 bg-neutral-50 p-3 font-medium text-neutral-800">
          <strong>BuyInstantKeys — Privacy Team</strong><br />
          Westwood Street, Hayward, California, 94544, USA<br />
          Email: <a href="mailto:info@buyinstantkeys.com" className="underline">info@buyinstantkeys.com</a>
        </p>
      </Section>
    </PolicyLayout>
    </>
  );
}
