import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "sonner";
import BrandDisclaimer from "@/components/BrandDisclaimer";
import ProductCard from "@/components/ProductCard";
import {
  ShieldCheck, ArrowRight, Key, User, Envelope,
  UserCircle, DownloadSimple, CheckCircle, Sparkle, LockKey, MonitorPlay, Phone,
  Clock, Headset,
} from "@phosphor-icons/react";

const STEPS = [
  { n: "01", icon: <UserCircle size={22} weight="duotone" />, title: "Sign in to your Norton account", desc: "Go to my.norton.com and sign in with your Norton account. Create a free account if you don't have one." },
  { n: "02", icon: <Key size={22} weight="duotone" />, title: "Enter your 25-digit product key", desc: "Click 'Enter a product key' on your Norton dashboard, then paste the key we delivered to your email." },
  { n: "03", icon: <DownloadSimple size={22} weight="duotone" />, title: "Download and install Norton", desc: "Follow the on-screen prompts to download your Norton product installer and complete the setup." },
  { n: "04", icon: <MonitorPlay size={22} weight="duotone" />, title: "Run first scan and stay protected", desc: "Launch Norton and run your first full scan — your device is now protected and your subscription is active." },
];

export default function Activation() {
  const nav = useNavigate();
  const [form, setForm] = useState({ customer_name: "", customer_email: "", customer_phone: "", product_key: "", honeypot: "" });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formStartTime] = useState(Date.now());

  useEffect(() => {
    setLoading(true);
    api.get("/products")
      .then((r) => setProducts(r.data.slice(0, 6)))
      .finally(() => setLoading(false));
  }, []);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
    return phoneRegex.test(phone);
  };

  const clearError = (field) => {
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

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
    
    const nameLower = form.customer_name.toLowerCase();
    const isSpam = spamPatterns.some(pattern => pattern.test(nameLower));
    
    if (isSpam) {
      toast.error("Submission blocked", { description: "Your submission appears to contain spam content." });
      return;
    }
    
    const newErrors = {};

    if (!form.customer_name.trim()) {
      newErrors.customer_name = "Name is required";
    }

    if (!form.customer_email.trim()) {
      newErrors.customer_email = "Email is required";
    } else if (!validateEmail(form.customer_email)) {
      newErrors.customer_email = "Please enter a valid email address";
    }

    if (!form.customer_phone.trim()) {
      newErrors.customer_phone = "Phone number is required";
    } else if (!validatePhone(form.customer_phone)) {
      newErrors.customer_phone = "Please enter a valid phone number";
    }


    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fix the errors in the form.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/activations", { 
        customer_name: form.customer_name, 
        customer_email: form.customer_email, 
        customer_phone: form.customer_phone, 
        product_key: form.product_key 
      });
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
            <Link to="/faq" className="hover:text-neutral-900">Resources</Link>
            <Link to="/contact" className="hover:text-neutral-900">Contact Us</Link>
          </div>
        </div>
      </div>

      {/* Hero band - simplified */}
      <section className="relative overflow-hidden border-b border-neutral-200 bg-gradient-to-b from-white via-yellow-50/40 to-white">
        <div className="container-page py-8 md:py-12">
          {/* Top bar with trust badges */}
          <div className="mx-auto max-w-4xl mb-8">
            <div className="flex flex-wrap items-center justify-center gap-4 rounded-2xl border border-neutral-200 bg-white px-6 py-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm">
                <ShieldCheck size={20} weight="duotone" className="text-emerald-600" />
                <span className="font-semibold text-neutral-900">100% Genuine</span>
              </div>
              <div className="hidden sm:block w-px h-5 bg-neutral-200"></div>
              <div className="flex items-center gap-2 text-sm">
                <Clock size={20} weight="duotone" className="text-blue-600" />
                <span className="font-semibold text-neutral-900">Fast Delivery</span>
              </div>
              <div className="hidden sm:block w-px h-5 bg-neutral-200"></div>
              <div className="flex items-center gap-2 text-sm">
                <Headset size={20} weight="duotone" className="text-purple-600" />
                <span className="font-semibold text-neutral-900">Expert Help</span>
              </div>
              <div className="hidden sm:block w-px h-5 bg-neutral-200"></div>
              <div className="flex items-center gap-2 text-sm">
                <LockKey size={20} weight="duotone" className="text-orange-600" />
                <span className="font-semibold text-neutral-900">Secure Payment</span>
              </div>
            </div>
          </div>
          
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-display text-3xl font-black leading-[1.05] tracking-tight text-neutral-900 sm:text-4xl lg:text-5xl">
              Need help activating your <span className="relative inline-block"><span className="relative z-10">security subscription</span><span className="absolute inset-x-0 bottom-1 z-0 h-3 bg-[#FFC220]" aria-hidden /></span>?
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-neutral-700">
              Enter your details below. Our activation team will guide you through setup and confirm your subscription is live — usually within 5–15 minutes.
            </p>
          </div>
        </div>
      </section>

      {/* Main split: Form | Instructions - Form first */}
      <section className="container-page py-10 md:py-14 lg:py-20">
        <div className="grid gap-8 md:gap-10 lg:grid-cols-2 lg:gap-16">
          {/* LEFT: Activation form */}
          <div id="activation-form" className="order-2 lg:order-1">
            <div className="sticky top-24 rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.15)] sm:p-8">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-neutral-900 text-[#FFC220]">
                  <Key size={22} weight="duotone" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Activation assistance</div>
                  <div className="font-display text-xl font-bold">Get activated in minutes</div>
                </div>
              </div>

              <form onSubmit={submit} className="mt-6 space-y-5">
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
                
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-600">Full name *</label>
                  <div className="relative mt-1">
                    <User size={18} weight="duotone" className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      data-testid="activation-name-input"
                      required
                      value={form.customer_name}
                      onChange={(e) => { setForm({ ...form, customer_name: e.target.value }); clearError('customer_name'); }}
                      placeholder="John Smith"
                      className={`w-full rounded-md border bg-white py-3 pl-10 pr-4 text-sm focus:border-yellow-500 focus:ring-2 focus:ring-yellow-400 ${errors.customer_name ? 'border-red-500' : 'border-neutral-300'}`}
                    />
                  </div>
                  {errors.customer_name && <p className="mt-1 text-xs text-red-600">{errors.customer_name}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-600">Email address *</label>
                  <div className="relative mt-1">
                    <Envelope size={18} weight="duotone" className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      data-testid="activation-email-input"
                      required
                      type="email"
                      value={form.customer_email}
                      onChange={(e) => { setForm({ ...form, customer_email: e.target.value }); clearError('customer_email'); }}
                      placeholder="you@example.com"
                      className={`w-full rounded-md border bg-white py-3 pl-10 pr-4 text-sm focus:border-yellow-500 focus:ring-2 focus:ring-yellow-400 ${errors.customer_email ? 'border-red-500' : 'border-neutral-300'}`}
                    />
                  </div>
                  {errors.customer_email && <p className="mt-1 text-xs text-red-600">{errors.customer_email}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-600">Phone number *</label>
                  <div className="relative mt-1">
                    <Phone size={18} weight="duotone" className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      data-testid="activation-phone-input"
                      required
                      type="tel"
                      value={form.customer_phone}
                      onChange={(e) => { setForm({ ...form, customer_phone: e.target.value }); clearError('customer_phone'); }}
                      placeholder="+1 (555) 123-4567"
                      className={`w-full rounded-md border bg-white py-3 pl-10 pr-4 text-sm focus:border-yellow-500 focus:ring-2 focus:ring-yellow-400 ${errors.customer_phone ? 'border-red-500' : 'border-neutral-300'}`}
                    />
                  </div>
                  {errors.customer_phone && <p className="mt-1 text-xs text-red-600">{errors.customer_phone}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-600">Norton product key (25 digits)</label>
                  <div className="relative mt-1">
                    <Key size={18} weight="duotone" className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      data-testid="activation-key-input"
                      value={form.product_key}
                      onChange={(e) => { setForm({ ...form, product_key: e.target.value.toUpperCase() }); clearError('product_key'); }}
                      placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
                      maxLength={40}
                      className="w-full rounded-md border border-neutral-300 bg-white py-3 pl-10 pr-4 font-mono text-sm tracking-widest focus:border-yellow-500 focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">Format: 25 alphanumeric characters with dashes (optional)</div>
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

                <div className="mt-4 rounded-lg bg-neutral-50 p-3 text-xs text-neutral-600">
                  <p className="font-semibold mb-1">Terms & Conditions:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>By submitting this form, you agree to receive activation assistance via email and phone</li>
                    <li>We are an independent service provider and not affiliated with NortonLifeLock Inc.</li>
                    <li>Norton and the Norton logo are trademarks of NortonLifeLock Inc.</li>
                    <li>Your information is used solely for activation assistance purposes</li>
                    <li>We do not sell or share your personal data with third parties</li>
                  </ul>
                </div>
              </form>

              <div className="mt-6 flex items-center justify-center gap-4 border-t border-neutral-200 pt-4 text-xs text-neutral-600">
                <div className="inline-flex items-center gap-1.5"><ShieldCheck size={14} weight="fill" className="text-emerald-600" /> SSL Secured</div>
                <div className="inline-flex items-center gap-1.5"><CheckCircle size={14} weight="fill" className="text-emerald-600" /> Expert assistance</div>
              </div>
              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-neutral-500">
                <Link to="/privacy" className="hover:text-neutral-900 underline">Privacy Policy</Link>
                <span>·</span>
                <Link to="/terms" className="hover:text-neutral-900 underline">Terms & Conditions</Link>
              </div>
            </div>
          </div>

          {/* RIGHT: Instructions */}
          <div className="order-1 lg:order-2">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">How to activate</div>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Four simple steps to activate your Norton subscription</h2>
            <p className="mt-3 text-neutral-600">Follow the steps below, or submit your details on the left and our activation team will handle everything for you.</p>

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
                    You'll find your product key in the email we sent after purchase. It's a 25-character alphanumeric code formatted like <code className="font-mono">XXXXX-XXXXX-XXXXX-XXXXX-XXXXX</code>. If you can't find it, <Link to="/contact" className="font-semibold underline">contact us</Link>.
                  </p>
                </div>
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

      {/* SEO Content Section */}
      <section className="border-t border-neutral-200 bg-neutral-50 py-16">
        <div className="container-page">
          <div className="mx-auto max-w-6xl">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Why choose Norton</div>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">Complete Norton activation and installation guidance</h2>
            
            <div className="mt-8 space-y-6 text-neutral-700">
              <p>
                Norton is a leading cybersecurity solution that provides comprehensive protection against viruses, malware, ransomware, and other online threats. When you <strong>activate Norton</strong> through our portal, you're ensuring your devices are protected with industry-leading security technology. Our team specializes in Norton activation, making the process seamless and hassle-free.
              </p>
              
              <h3 className="font-display text-xl font-semibold text-neutral-900">How to install Norton on your device</h3>
              <p>
                Installing Norton is straightforward once you have your product key. After you <strong>install Norton</strong>, the software will guide you through the initial setup process. Whether you're using Windows, Mac, iOS, or Android, Norton provides optimized protection for your specific platform. Our activation team can assist you with any installation questions to ensure your Norton subscription is properly configured.
              </p>
              
              <h3 className="font-display text-xl font-semibold text-neutral-900">Norton activation process explained</h3>
              <p>
                The Norton activation process begins with your 25-digit product key. This key is essential to <strong>activate Norton</strong> and unlock your subscription benefits. Simply enter your key at my.norton.com or use our activation form above, and our team will verify your subscription. Once activated, you can download and install Norton on all your devices, depending on your plan's device limit.
              </p>
              
              <h3 className="font-display text-xl font-semibold text-neutral-900">Benefits of proper Norton activation</h3>
              <p>
                Proper Norton activation ensures you receive all the features included in your subscription, including real-time threat protection, secure VPN, password manager, and cloud backup. When you <strong>activate Norton</strong> correctly, you'll have access to automatic updates and 24/7 customer service. Our activation service guarantees that your Norton subscription is properly registered and ready to protect your digital life.
              </p>
              
              <h3 className="font-display text-xl font-semibold text-neutral-900">Troubleshooting Norton installation issues</h3>
              <p>
                If you encounter issues when trying to <strong>install Norton</strong>, our team is here to help. Common problems during Norton activation include invalid product keys, expired subscriptions, or compatibility issues. We provide comprehensive guidance to resolve any Norton activation challenges quickly, so you can get back to enjoying full protection without delay.
              </p>
              
              <div className="mt-8 rounded-xl border border-yellow-200 bg-yellow-50 p-6">
                <div className="flex items-start gap-3">
                  <ShieldCheck size={22} weight="duotone" className="mt-1 shrink-0 text-neutral-900" />
                  <div>
                    <div className="font-display font-semibold">Need help with Norton activation?</div>
                    <p className="mt-1 text-sm text-neutral-700">
                      Our dedicated team specializes in Norton activation and installation guidance. Submit your details above, and we'll guide you through the entire process to ensure your Norton subscription is activated correctly and your devices are fully protected.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="border-t border-neutral-200 bg-white py-16">
        <div className="container-page">
          <div className="mx-auto max-w-4xl text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Popular Products</div>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">Shop Norton Security Products</h2>
            <p className="mt-3 text-neutral-600">Get genuine Norton software at up to 70% off retail with instant email delivery.</p>
          </div>
          <div className="mx-auto mt-10 grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              [1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-80 animate-pulse rounded-xl bg-neutral-100" />
              ))
            ) : (
              products.map((p) => <ProductCard key={p.id} product={p} />)
            )}
          </div>
          <div className="mt-10 text-center">
            <Link to="/products" className="inline-flex items-center gap-2 rounded-full border border-neutral-900 bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-800">
              View All Products
              <ArrowRight size={16} weight="bold" />
            </Link>
          </div>
        </div>
      </section>

      <BrandDisclaimer />
    </div>
  );
}
