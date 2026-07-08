import { Link } from "react-router-dom";
import { CheckCircle, ChatCircleDots, Envelope, ShieldCheck, ArrowRight, Clock } from "@phosphor-icons/react";

export default function ActivationThanks() {
  const openChat = () => {
    // If a chat widget is loaded (e.g., Tawk/Intercom), try to open it. Fallback to contact page.
    try {
      if (window.Tawk_API && window.Tawk_API.maximize) { window.Tawk_API.maximize(); return; }
      if (window.Intercom) { window.Intercom("show"); return; }
    } catch (e) { /* ignore */ }
    window.location.href = "mailto:info@buyinstantkeys.com?subject=Norton%20activation%20help&body=Hi%20BuyInstantKeys%20team%2C%0A%0AI%20need%20help%20activating%20my%20Norton%20subscription.";
  };

  return (
    <div className="bg-neutral-50">
      {/* Norton header */}
      <div className="border-b border-neutral-200 bg-white">
        <div className="container-page flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-[#FFC220]">
              <ShieldCheck size={18} weight="fill" className="text-white" />
            </div>
            <div className="font-display text-xl font-black tracking-tight text-neutral-900">norton</div>
            <span className="ml-3 hidden text-sm text-neutral-600 sm:inline">Product Activation</span>
          </div>
        </div>
      </div>

      <section className="container-page py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle size={54} weight="duotone" />
          </div>
          <h1 data-testid="activation-thanks-title" className="mt-6 font-display text-4xl font-black tracking-tight text-neutral-900 sm:text-5xl">
            Thanks for the details!
          </h1>
          <p className="mt-4 text-lg text-neutral-700">
            We've received your Norton activation request. Our team is verifying your product key and will email you the activation details shortly.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-neutral-200 bg-white p-5 text-left">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#FFC220] text-neutral-900"><CheckCircle size={18} weight="duotone" /></div>
              <div className="mt-3 font-semibold">Received</div>
              <div className="mt-1 text-xs text-neutral-600">Your request is queued for our activation team</div>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-5 text-left">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-neutral-900 text-[#FFC220]"><Clock size={18} weight="duotone" /></div>
              <div className="mt-3 font-semibold">Verifying key</div>
              <div className="mt-1 text-xs text-neutral-600">Typically 5–15 minutes</div>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-5 text-left">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-600 text-white"><Envelope size={18} weight="duotone" /></div>
              <div className="mt-3 font-semibold">Email delivery</div>
              <div className="mt-1 text-xs text-neutral-600">Activation instructions to your inbox</div>
            </div>
          </div>

          <div className="mt-10 rounded-2xl border border-yellow-200 bg-yellow-50 p-6 text-left">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <ChatCircleDots size={28} weight="duotone" className="mt-1 shrink-0 text-neutral-900" />
                <div>
                  <div className="font-display text-lg font-semibold">Need help right now?</div>
                  <p className="text-sm text-neutral-700">Chat with our activation team for instant assistance — we're online 24/7.</p>
                </div>
              </div>
              <button
                data-testid="activation-thanks-chat-btn"
                onClick={openChat}
                className="btn-primary"
              >
                <ChatCircleDots size={18} weight="duotone" /> Chat now <ArrowRight size={16} weight="bold" />
              </button>
            </div>
          </div>

          <p className="mt-6 text-sm text-neutral-500">
            You'll receive the activation details on the email you provided shortly.
            <br />
            Check your spam folder if it doesn't arrive within 15 minutes.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link to="/activation" data-testid="activation-thanks-back" className="btn-outline">Submit another key</Link>
            <Link to="/" className="btn-dark">Back to store <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
