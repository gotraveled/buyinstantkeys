export default function RefundPolicy() {
  return (
    <div className="container-page py-14">
      <div className="mx-auto max-w-3xl">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Legal</div>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Refund policy</h1>
        <div className="prose prose-neutral mt-8 max-w-none text-neutral-700">
          <p>We stand behind every Norton license key we sell. If you have any issues, we're here to help.</p>
          <h2 className="mt-8 font-display text-xl font-semibold">30-day money-back guarantee</h2>
          <p>You may request a full refund within 30 days of purchase if:</p>
          <ul className="list-disc pl-6">
            <li>Your license key cannot be activated on Norton's official site</li>
            <li>Your key has already been redeemed</li>
            <li>You changed your mind and haven't activated the key</li>
          </ul>
          <h2 className="mt-8 font-display text-xl font-semibold">How to request a refund</h2>
          <p>Email us at <a className="underline" href="mailto:support@buyinstantkeys.com">support@buyinstantkeys.com</a> with your order number and reason. Refunds are typically processed within 3-5 business days.</p>
          <h2 className="mt-8 font-display text-xl font-semibold">Exclusions</h2>
          <p>Refunds cannot be issued after 30 days from the order date or once a key has been successfully activated and used.</p>
        </div>
      </div>
    </div>
  );
}
