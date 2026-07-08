import PolicyLayout, { Section } from "@/components/PolicyLayout";

const SECTIONS = [
  { id: "general", title: "1. General disclaimer" },
  { id: "affiliation", title: "2. No brand affiliation" },
  { id: "trademarks", title: "3. Trademarks & intellectual property" },
  { id: "accuracy", title: "4. Information accuracy" },
  { id: "third-party", title: "5. Third-party links & content" },
  { id: "no-warranty", title: "6. No warranty for third-party software" },
  { id: "ftc", title: "7. FTC compliance & material connections" },
  { id: "endorsements", title: "8. Reviews, endorsements & testimonials" },
  { id: "professional-advice", title: "9. No professional advice" },
  { id: "eou", title: "10. Errors, omissions & updates" },
  { id: "contact", title: "11. Contact" },
];

export default function Disclaimer() {
  return (
    <PolicyLayout
      title="Disclaimer"
      subtitle="Important legal notices about BuyInstantKeys, brand relationships, product information, and FTC compliance."
      lastUpdated="February 1, 2026"
      sections={SECTIONS}
    >
      <Section id="general" title="1. General disclaimer">
        <p>The information provided on buyinstantkeys.com (the "Site") is intended for general informational and commercial purposes only. Use of the Site and any purchase made through it is at your own risk. BuyInstantKeys, its owners, employees, and agents make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability, or availability of the Site or the information, products, services, or related graphics contained on the Site.</p>
      </Section>

      <Section id="affiliation" title="2. No brand affiliation — we are an independent reseller">
        <p><strong>BuyInstantKeys is an independent digital software reseller.</strong> We are <strong>not affiliated with, endorsed by, sponsored by, or in any way officially connected to</strong>:</p>
        <ul className="list-disc pl-6">
          <li>NortonLifeLock</li>
          <li>Gen Digital Inc.</li>
          <li>Norton, LifeLock, or any Norton-branded product</li>
          <li>Any of the above entities' parents, subsidiaries, affiliates, or brands</li>
          <li>Any other software publisher, manufacturer, distributor, or brand referenced on this Site</li>
        </ul>
        <p>Any use of brand names, product names, logos, or trademarks on this Site is solely for the identification of products offered for resale. This does not imply any partnership, endorsement, sponsorship, or affiliation with the trademark owner. BuyInstantKeys is an authorized reseller of digital license keys and is not licensed to represent or make statements on behalf of any brand.</p>
      </Section>

      <Section id="trademarks" title="3. Trademarks & intellectual property">
        <p>All trademarks, service marks, trade names, logos, and product names used on the Site are the property of their respective owners:</p>
        <ul className="list-disc pl-6">
          <li><strong>Norton®</strong> and <strong>LifeLock®</strong> are registered trademarks of Gen Digital Inc.</li>
          <li><strong>Windows®</strong> is a registered trademark of Microsoft Corporation.</li>
          <li><strong>macOS®</strong> and <strong>iOS®</strong> are registered trademarks of Apple Inc.</li>
          <li><strong>Android™</strong> is a trademark of Google LLC.</li>
          <li><strong>PayPal®</strong> is a registered trademark of PayPal Holdings, Inc.</li>
        </ul>
        <p>The use of these names, marks, and logos on our Site does not constitute a claim of ownership or affiliation. All rights in and to these marks remain with their respective owners.</p>
      </Section>

      <Section id="accuracy" title="4. Information accuracy">
        <p>Product descriptions, features, device counts, pricing, and availability shown on the Site are based on information provided by the software publishers and are believed to be accurate at the time of publication. However:</p>
        <ul className="list-disc pl-6">
          <li>Software publishers may change product features, pricing, subscription terms, or names at any time without notifying resellers.</li>
          <li>Screenshots, images, and product descriptions are for illustrative purposes only and may not perfectly reflect the current publisher offering.</li>
          <li>Regional availability, language support, and system requirements are determined by the publisher — please verify on the publisher's official site before purchase.</li>
          <li>Typographical errors, pricing errors, and stock discrepancies may occur. We reserve the right to correct any such error and, if necessary, cancel an order and issue a full refund.</li>
        </ul>
      </Section>

      <Section id="third-party" title="5. Third-party links & content">
        <p>Our Site may contain links to third-party websites (such as my.norton.com, PayPal, or the publisher's product pages) that are not owned or controlled by BuyInstantKeys. We have no control over — and assume no responsibility for — the content, privacy policies, terms of use, or practices of any third-party websites. Accessing linked third-party sites is at your own risk.</p>
      </Section>

      <Section id="no-warranty" title="6. No warranty for third-party software">
        <p>The software License keys we sell are for third-party products created and maintained by other companies. BuyInstantKeys does not develop, host, update, patch, or provide direct technical support for the software itself. Any warranties relating to the software — including but not limited to malware detection accuracy, feature performance, uptime, or compatibility — are provided <strong>solely by the software publisher</strong> under its End-User License Agreement (EULA).</p>
        <p>You are strongly encouraged to review the publisher's EULA before installation and activation. If the software fails to activate, we will assist you or issue a refund under our <a href="/refund-policy" className="underline">Refund Policy</a>. If the software has bugs, missing features, or fails to protect against a specific threat, that is a matter between you and the publisher.</p>
      </Section>

      <Section id="ftc" title="7. FTC compliance & material connections">
        <p>In accordance with the U.S. Federal Trade Commission's 16 CFR § 255 "Guides Concerning the Use of Endorsements and Testimonials in Advertising", we disclose the following:</p>
        <ul className="list-disc pl-6">
          <li>BuyInstantKeys receives revenue from the sale of digital license keys featured on this Site. Every product page therefore represents a potential financial interest in your purchase decision.</li>
          <li>Star ratings and review counts shown on product cards are aggregated indicators and do not represent verified purchase reviews of the reseller. Feature comparisons are based on the publisher's published information.</li>
          <li>Discount claims (e.g., "Save 70%") are calculated against the manufacturer's suggested retail price (MSRP) at the time of listing.</li>
          <li>We may offer promotional codes and limited-time offers. The savings are real for eligible customers but may not stack with other offers.</li>
        </ul>
      </Section>

      <Section id="endorsements" title="8. Reviews, endorsements & testimonials">
        <p>Any customer testimonials or reviews shown on the Site reflect the experiences of specific customers and are not guarantees of a similar outcome for you. Your experience with the software will depend on your device, use case, environment, and individual expectations.</p>
      </Section>

      <Section id="professional-advice" title="9. No professional advice">
        <p>The content on our Site is provided for general information only. It is not intended to be, and should not be construed as, professional advice on cybersecurity, information technology, legal matters, tax planning, financial planning, or any other regulated field. For matters that require professional expertise, please consult a qualified professional in the relevant jurisdiction.</p>
      </Section>

      <Section id="eou" title="10. Errors, omissions & updates">
        <p>While we strive to keep the Site up to date, we do not guarantee that all content is current or error-free. We reserve the right to add, modify, remove, or discontinue any content, product, or service at any time without prior notice. If you identify an error, we welcome feedback at <a href="mailto:info@buyinstantkeys.com" className="underline">info@buyinstantkeys.com</a>.</p>
      </Section>

      <Section id="contact" title="11. Contact">
        <p className="rounded-md border border-neutral-200 bg-neutral-50 p-3 font-medium text-neutral-800">
          <strong>BuyInstantKeys</strong><br />
          Westwood Street, Hayward, California, 94544, USA<br />
          Email: <a href="mailto:info@buyinstantkeys.com" className="underline">info@buyinstantkeys.com</a>
        </p>
      </Section>
    </PolicyLayout>
  );
}
