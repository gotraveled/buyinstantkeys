import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "sonner";
import BrandDisclaimer from "@/components/BrandDisclaimer";
import {
  ShieldCheck, ArrowRight, Key, User, Envelope,
  UserCircle, DownloadSimple, CheckCircle, Sparkle, LockKey, MonitorPlay,
} from "@phosphor-icons/react";

const STEPS = [
  { n: "01", icon: <UserCircle size={22} weight="duotone" />, title: "Sign in to your Norton account", desc: "Go to my.norton.com and sign in with your Norton account. Create a free account if you don't have one." },
  { n: "02", icon: <Key size={22} weight="duotone" />, title: "Enter your 25-digit product key", desc: "Click 'Enter a product key' on your Norton dashboard, then paste the key we delivered to your email." },
  { n: "03", icon: <DownloadSimple size={22} weight="duotone" />, title: "Download and install Norton", desc: "Follow the on-screen prompts to download your Norton product installer and complete the setup." },
  { n: "04", icon: <MonitorPlay size={22} weight="duotone" />, title: "Run first scan and stay protected", desc: "Launch Norton and run your first full scan — your device is now protected and your subscription is active." },
];

export default function Activation() {
  const nav = useNavigate();
  const [form, setForm] = useState({ customer_name: "", customer_email: "", product_key: "" });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.customer_name.trim() || !form.customer_email.trim() || !form.product_key.trim()) {
      toast.error("Please complete all fields.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/activations", form);
      nav("/activation/thanks");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-neutral-50">
      {/* Norton-brand header strip */}
      <div className="border-b border-neutral-200 bg-white">
        <div className="container-page flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-[#FFC220]">
              <ShieldCheck size={18} weight="fill" className="text-white" />
            </div>
            <div className="font-display text-xl font-black tracking-tight text-neutral-900">norton</div>
            <span className="ml-3 hidden text-sm text-neutral-600 sm:inline">Product Activation</span>
          </div>
          <div className="hidden items-center gap-4 text-sm text-neutral-700 md:flex">
            <a href="#activation-form" className="hover:text-neutral-900">Activate</a>
            <Link to="/faq" className="hover:text-neutral-900">Help</Link>
            <Link to="/contact" className="hover:text-neutral-900">Support</Link>
          </div>
        </div>
      </div>

      {/* Hero band */}
      <section className="relative overflow-hidden border-b border-neutral-200 bg-gradient-to-b from-white via-yellow-50/40 to-white">
        <div className="container-page grid gap-10 py-14 md:grid-cols-2 md:py-20">
          <div className="fade-up max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-300 bg-yellow-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-700">
              <Sparkle size={14} weight="fill" className="text-yellow-500" /> Norton Activation Portal
            </div>
            <h1 className="mt-5 font-display text-4xl font-black leading-[1.05] tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
              Activate your <span className="relative inline-block"><span className="relative z-10">Norton subscription</span><span className="absolute inset-x-0 bottom-1 z-0 h-3 bg-[#FFC220]" aria-hidden /></span> in minutes
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-neutral-700">
              Enter your details and 25-digit Norton product key below. Our activation team will guide you through setup and confirm your subscription is live — usually within 5–15 minutes.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-neutral-700">
              <div className="inline-flex items-center gap-1.5"><CheckCircle size={16} weight="fill" className="text-emerald-600" /> 100% genuine keys</div>
              <div className="inline-flex items-center gap-1.5"><CheckCircle size={16} weight="fill" className="text-emerald-600" /> Free installation help</div>
              <div className="inline-flex items-center gap-1.5"><CheckCircle size={16} weight="fill" className="text-emerald-600" /> 24/7 support</div>
            </div>
          </div>

          {/* Right decorative shield */}
          <div className="relative flex items-center justify-center">
            <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-br from-yellow-100 to-white blur-2xl" />
            <div className="relative grid h-64 w-64 place-items-center rounded-full bg-white shadow-[0_30px_60px_-20px_rgba(0,0,0,0.18)]">
              <div className="grid h-52 w-52 place-items-center rounded-full bg-[#FFC220]">
                <ShieldCheck size={110} weight="fill" className="text-white" />
              </div>
              <div className="absolute -bottom-4 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-900">Verified & Protected</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main split: Instructions | Form */}
      <section className="container-page py-14 md:py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* LEFT: Instructions */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">How to activate</div>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Four simple steps to activate your Norton subscription</h2>
            <p className="mt-3 text-neutral-600">Follow the steps below, or submit your details on the right and our activation team will handle everything for you.</p>

            <ol className="mt-10 space-y-6">
              {STEPS.map((s) => (
                <li key={s.n} className="relative flex gap-5 rounded-xl border border-neutral-200 bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
                  <div className="flex flex-col items-center">
                    <div className="grid h-11 w-11 place-items-center rounded-lg bg-[#FFC220] text-neutral-900">
                      {s.icon}
                    </div>
                    <span className="mt-3 font-mono text-xs text-neutral-500">{s.n}</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-display text-lg font-semibold tracking-tight">{s.title}</div>
                    <p className="mt-1 text-sm leading-relaxed text-neutral-600">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-10 rounded-xl border border-yellow-200 bg-yellow-50 p-6">
              <div className="flex items-start gap-3">
                <LockKey size={22} weight="duotone" className="mt-1 shrink-0 text-neutral-900" />
                <div>
                  <div className="font-display font-semibold">Where do I find my 25-digit product key?</div>
                  <p className="mt-1 text-sm text-neutral-700">
                    You'll find your product key in the email we sent after purchase. It's a 25-character alphanumeric code formatted like <code className="font-mono">XXXXX-XXXXX-XXXXX-XXXXX-XXXXX</code>. If you can't find it, <Link to="/contact" className="font-semibold underline">contact support</Link>.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Activation form */}
          <div id="activation-form">
            <div className="sticky top-24 rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.15)] sm:p-8">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-neutral-900 text-[#FFC220]">
                  <Key size={22} weight="duotone" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Free activation help</div>
                  <div className="font-display text-xl font-bold">Get activated in minutes</div>
                </div>
              </div>

              <form onSubmit={submit} className="mt-6 space-y-5">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-600">Full name</label>
                  <div className="relative mt-1">
                    <User size={18} weight="duotone" className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      data-testid="activation-name-input"
                      required
                      value={form.customer_name}
                      onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                      placeholder="John Smith"
                      className="w-full rounded-md border border-neutral-300 bg-white py-3 pl-10 pr-4 text-sm focus:border-yellow-500 focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-600">Email address</label>
                  <div className="relative mt-1">
                    <Envelope size={18} weight="duotone" className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      data-testid="activation-email-input"
                      required
                      type="email"
                      value={form.customer_email}
                      onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
                      placeholder="you@example.com"
                      className="w-full rounded-md border border-neutral-300 bg-white py-3 pl-10 pr-4 text-sm focus:border-yellow-500 focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-600">Norton product key (25 digits)</label>
                  <div className="relative mt-1">
                    <Key size={18} weight="duotone" className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      data-testid="activation-key-input"
                      required
                      value={form.product_key}
                      onChange={(e) => setForm({ ...form, product_key: e.target.value.toUpperCase() })}
                      placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
                      maxLength={40}
                      className="w-full rounded-md border border-neutral-300 bg-white py-3 pl-10 pr-4 font-mono text-sm tracking-widest focus:border-yellow-500 focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">Format: 25 alphanumeric characters with dashes</div>
                </div>

                <button
                  data-testid="activation-submit-btn"
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full"
                >
                  {submitting ? "Submitting..." : "Activate my subscription"}
                  <ArrowRight size={18} weight="bold" />
                </button>

                <p className="text-center text-xs text-neutral-500">
                  By submitting, you agree to our <Link to="/faq" className="underline">terms</Link>. Your data is kept secure and never shared.
                </p>
              </form>

              <div className="mt-6 flex items-center justify-center gap-4 border-t border-neutral-200 pt-4 text-xs text-neutral-600">
                <div className="inline-flex items-center gap-1.5"><ShieldCheck size={14} weight="fill" className="text-emerald-600" /> SSL Secured</div>
                <div className="inline-flex items-center gap-1.5"><CheckCircle size={14} weight="fill" className="text-emerald-600" /> Human support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ strip */}
      <section className="border-t border-neutral-200 bg-white py-16">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Common questions</div>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">Activation, made easy</h2>
          </div>
          <div className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-2">
            {[
              { q: "How long does activation take?", a: "Most activations are completed within 5–15 minutes after we receive your request." },
              { q: "Do I need a Norton account?", a: "Yes — a free Norton account (my.norton.com) is required to store your subscription and download the software." },
              { q: "My key doesn't work — what now?", a: "Submit your key here and our team will verify and replace it if there's any issue, at no cost." },
              { q: "Which devices does it protect?", a: "Norton works on Windows PC, Mac, iOS and Android. The number of devices depends on the plan you purchased." },
            ].map((f, i) => (
              <div key={i} className="rounded-xl border border-neutral-200 bg-neutral-50 p-5">
                <div className="font-display font-semibold">{f.q}</div>
                <p className="mt-1 text-sm text-neutral-700">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <BrandDisclaimer />
    </div>
  );
}
