import PolicyLayout, { Section } from "@/components/PolicyLayout";

const SECTIONS = [
  { id: "acceptance", title: "1. Acceptance of terms" },
  { id: "definitions", title: "2. Definitions" },
  { id: "eligibility", title: "3. Eligibility" },
  { id: "products", title: "4. Products & services" },
  { id: "pricing", title: "5. Pricing & payment" },
  { id: "orders", title: "6. Order process & delivery" },
  { id: "activation", title: "7. License activation" },
  { id: "refunds", title: "8. Refunds & cancellations" },
  { id: "ip", title: "9. Intellectual property & trademarks" },
  { id: "prohibited", title: "10. Prohibited uses" },
  { id: "warranty", title: "11. Disclaimer of warranties" },
  { id: "liability", title: "12. Limitation of liability" },
  { id: "indemnification", title: "13. Indemnification" },
  { id: "termination", title: "14. Termination" },
  { id: "governing-law", title: "15. Governing law" },
  { id: "disputes", title: "16. Dispute resolution" },
  { id: "changes", title: "17. Changes to terms" },
  { id: "contact", title: "18. Contact" },
];

export default function Terms() {
  return (
    <PolicyLayout
      title="Terms and Conditions"
      subtitle="These Terms govern your use of BuyInstantKeys.com and the purchase of digital license keys through our platform."
      lastUpdated="February 1, 2026"
      sections={SECTIONS}
    >
      <Section id="acceptance" title="1. Acceptance of terms">
        <p>Welcome to BuyInstantKeys ("we", "us", "our", or "the Company"). These Terms and Conditions ("Terms") constitute a legally binding agreement between you ("Customer", "you", "your") and BuyInstantKeys governing your access to and use of the website located at <strong>buyinstantkeys.com</strong> (the "Site") and any purchases you make through it.</p>
        <p>By accessing the Site, creating an account, submitting an order, or using any of our services, you acknowledge that you have read, understood, and agree to be bound by these Terms and by our Privacy Policy, Refund Policy, and Disclaimer, which are incorporated herein by reference. If you do not agree to these Terms, you must not use the Site.</p>
      </Section>

      <Section id="definitions" title="2. Definitions">
        <ul className="list-disc pl-6">
          <li><strong>"Product"</strong> — a digital license key or activation code for third-party software, primarily Norton security products.</li>
          <li><strong>"Order"</strong> — a request submitted by you through the Site to purchase one or more Products.</li>
          <li><strong>"License"</strong> — the right, granted by the software publisher, to use the Product for the term and conditions set out by the publisher.</li>
          <li><strong>"Publisher"</strong> — the original software vendor (e.g., Gen Digital Inc. for Norton products) whose end-user license agreement (EULA) governs your use of the software.</li>
        </ul>
      </Section>

      <Section id="eligibility" title="3. Eligibility">
        <p>You must be at least 18 years of age, or the age of majority in your jurisdiction, to place an order with us. By using the Site, you represent and warrant that you meet this age requirement and that you have the legal capacity to enter into a binding contract.</p>
      </Section>

      <Section id="products" title="4. Products & services">
        <p>BuyInstantKeys is an independent digital software reseller. We source authentic license keys from authorized channels and deliver them electronically to our customers via email. All Products are sold as digital license keys only — <strong>no physical goods are shipped</strong>.</p>
        <p>The use of any Product is subject to the end-user license agreement (EULA) provided by the Publisher. It is your responsibility to review and accept the Publisher's EULA before using the software.</p>
        <p>Product descriptions, features, device counts, and subscription lengths are provided by us based on publicly available Publisher information. We do our best to ensure accuracy, but we do not warrant that all descriptions are current, complete, or error-free. In the event of a discrepancy, the Publisher's terms control.</p>
      </Section>

      <Section id="pricing" title="5. Pricing & payment">
        <p>All prices are displayed in U.S. Dollars (USD) unless otherwise stated and are exclusive of applicable taxes, which will be calculated at checkout where required by law. Prices are subject to change without notice; however, once an Order is confirmed, the price displayed at the time of purchase will apply.</p>
        <p>Payment is processed securely through <strong>PayPal, Inc.</strong> We do not store or have access to your full payment card or bank account details. By submitting an Order, you authorize us and PayPal to charge your selected payment method for the total Order amount.</p>
        <p>If a payment is declined, delayed, or reversed (including chargebacks), we reserve the right to suspend or cancel the corresponding Order and revoke any License keys already delivered.</p>
      </Section>

      <Section id="orders" title="6. Order process & digital delivery">
        <p>After you complete checkout, your Order enters a "pending" state until payment is confirmed. Our activation team reviews each Order for fraud and payment verification. Once verified, we deliver your License key(s) via email to the address you provided.</p>
        <p><strong>Expected delivery time: 5–15 minutes after payment confirmation.</strong> In rare cases — such as high-fraud-risk transactions, incomplete details, or outside business hours — delivery may take up to 24 hours. If your key has not arrived within 24 hours, please check your spam folder and then contact us.</p>
        <p>It is your responsibility to provide a valid, accessible email address at checkout. We are not responsible for delivery failures caused by incorrect email addresses, aggressive spam filters, or full inboxes.</p>
      </Section>

      <Section id="activation" title="7. License activation & use">
        <p>To activate your License, you must sign in to the Publisher's activation portal (e.g., my.norton.com) and enter the 25-character product key we deliver. Free activation assistance is available through our Activation Portal at <a href="/activation" className="underline">buyinstantkeys.com/activation</a>.</p>
        <p>You are responsible for complying with the Publisher's EULA, including all restrictions on the number of devices, geographic use, personal vs. commercial use, and prohibitions on transfer or resale of the License.</p>
      </Section>

      <Section id="refunds" title="8. Refunds & cancellations">
        <p>Refunds are governed by our <a href="/refund-policy" className="underline">Refund Policy</a>, which is incorporated by reference. In summary, we offer a 30-day money-back guarantee for Licenses that fail to activate through no fault of the customer. Fully activated Licenses are non-refundable except where required by applicable consumer protection law.</p>
      </Section>

      <Section id="ip" title="9. Intellectual property & trademarks">
        <p>All content on the Site — including text, logos, images, graphics, and code — belongs to BuyInstantKeys or is used with permission, and is protected by copyright, trademark, and other intellectual property laws.</p>
        <p><strong>Norton®, LifeLock®, and any related product names are registered trademarks of Gen Digital Inc.</strong> BuyInstantKeys is not affiliated with, endorsed by, sponsored by, or in any way officially connected to Gen Digital Inc., NortonLifeLock, or any of their subsidiaries. All third-party product names, logos, and brands are property of their respective owners and are used solely for identification purposes.</p>
      </Section>

      <Section id="prohibited" title="10. Prohibited uses">
        <p>You agree not to:</p>
        <ul className="list-disc pl-6">
          <li>Resell, sublicense, or transfer any License purchased from us in violation of the Publisher's EULA</li>
          <li>Use the Site or Products for any illegal, fraudulent, or unauthorized purpose</li>
          <li>Attempt to gain unauthorized access to our systems, networks, or admin dashboard</li>
          <li>Introduce viruses, trojans, worms, logic bombs, or other harmful material</li>
          <li>Use automated tools (scrapers, bots) to access the Site without our prior written consent</li>
          <li>Impersonate any person, entity, or misrepresent your affiliation</li>
          <li>Submit false, misleading, or stolen payment information</li>
        </ul>
      </Section>

      <Section id="warranty" title="11. Disclaimer of warranties">
        <p>THE SITE AND ALL PRODUCTS ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR ACCURACY. We do not warrant that the Site will be uninterrupted, timely, secure, or error-free.</p>
        <p>Any warranties regarding the software itself are provided solely by the Publisher pursuant to its EULA. We make no warranty regarding the quality, performance, or suitability of the software for your specific needs.</p>
      </Section>

      <Section id="liability" title="12. Limitation of liability">
        <p>To the maximum extent permitted by law, BuyInstantKeys and its officers, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation loss of profits, data, use, goodwill, or other intangible losses, arising out of or in connection with your use of the Site or any Product.</p>
        <p>Our total aggregate liability to you for any claim arising out of or in connection with these Terms shall not exceed the amount you paid to us for the specific Order giving rise to the claim.</p>
      </Section>

      <Section id="indemnification" title="13. Indemnification">
        <p>You agree to indemnify, defend, and hold harmless BuyInstantKeys and its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable attorneys' fees) arising out of or in any way connected with (i) your access to or use of the Site, (ii) your violation of these Terms, (iii) your violation of any third-party right, or (iv) any content you submit through the Site.</p>
      </Section>

      <Section id="termination" title="14. Termination">
        <p>We may suspend or terminate your access to the Site at any time, with or without cause and with or without notice, if we determine that you have violated these Terms or that your conduct poses a risk to us, our customers, or third parties. Upon termination, any Licenses obtained through fraudulent means will be revoked.</p>
      </Section>

      <Section id="governing-law" title="15. Governing law">
        <p>These Terms are governed by and construed in accordance with the laws of the State of California, United States, without regard to conflict-of-law principles. You consent to the exclusive jurisdiction of the state and federal courts located in Alameda County, California, for the resolution of any disputes arising under or in connection with these Terms.</p>
      </Section>

      <Section id="disputes" title="16. Dispute resolution">
        <p>Before filing a claim, you agree to attempt to resolve any dispute informally by contacting <a href="mailto:info@buyinstantkeys.com" className="underline">info@buyinstantkeys.com</a>. We will respond within 30 days. If the dispute is not resolved within 60 days, either party may pursue formal legal action.</p>
        <p>Any dispute not resolved informally shall be settled by binding arbitration administered by the American Arbitration Association ("AAA") under its Consumer Arbitration Rules, in Alameda County, California. You waive any right to a jury trial and to participate in a class action.</p>
      </Section>

      <Section id="changes" title="17. Changes to terms">
        <p>We reserve the right to modify these Terms at any time. Material changes will be posted on this page with a new "Last updated" date. Your continued use of the Site after such changes constitutes your acceptance of the revised Terms.</p>
      </Section>

      <Section id="contact" title="18. Contact">
        <p className="rounded-md border border-neutral-200 bg-neutral-50 p-3 font-medium text-neutral-800">
          <strong>BuyInstantKeys</strong><br />
          Westwood Street, Hayward, California, 94544, USA<br />
          Email: <a href="mailto:info@buyinstantkeys.com" className="underline">info@buyinstantkeys.com</a>
        </p>
      </Section>
    </PolicyLayout>
  );
}
