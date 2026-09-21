import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import BrandDisclaimer from "@/components/BrandDisclaimer";
import ProductCard from "@/components/ProductCard";
import LoadError from "@/components/LoadError";
import { getBrand, BRAND_LIST } from "@/lib/brands";
import {
  ShieldCheck, ArrowRight, Key, User, Envelope,
  UserCircle, DownloadSimple, CheckCircle, LockKey, MonitorPlay, Phone,
  Clock, Headset,
} from "@phosphor-icons/react";

const STEP_ICONS = [
  <UserCircle size={22} weight="duotone" />,
  <Key size={22} weight="duotone" />,
  <DownloadSimple size={22} weight="duotone" />,
  <MonitorPlay size={22} weight="duotone" />,
];

export default function ActivationBrand() {
  const { brand: brandSlug } = useParams();
  const brand = getBrand(brandSlug);
  const nav = useNavigate();
  const [form, setForm] = useState({ customer_name: "", customer_email: "", customer_phone: "", product_key: "", honeypot: "" });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [formStartTime] = useState(Date.now());

  const loadProducts = () => {
    if (!brand) { setLoading(false); return; }
    setLoading(true);
    setLoadError(false);
    api.get("/products", { params: { brand: brand.name } })
      .then((r) => setProducts(r.data.slice(0, 3)))
      .catch(() => { setProducts([]); setLoadError(true); })
      .finally(() => setLoading(false));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(loadProducts, [brand]);

  if (!brand) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="font-display text-3xl font-bold">Choose your product to activate</h1>
        <p className="mt-3 text-neutral-600">Select the brand of the license key you purchased.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {BRAND_LIST.map((b) => (
            <Link key={b.slug} to={`/activation/${b.slug}`} className="btn-outline">{b.name}</Link>
          ))}
        </div>
      </div>
    );
  }

  const theme = {
    "--brand": brand.color,
    "--brand-dark": brand.colorDark,
    "--brand-text": brand.textOn,
    "--brand-soft": brand.soft,
    "--brand-softer": brand.softAlt,
    "--brand-border": brand.border,
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone) => /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/.test(phone);
  const clearError = (field) => setErrors((prev) => ({ ...prev, [field]: "" }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.honeypot) { toast.error("Submission failed", { description: "Please try again." }); return; }
    if (Date.now() - formStartTime < 3000) { toast.error("Please slow down", { description: "Submit too quickly. Please wait and try again." }); return; }

    const spamPatterns = [/http/i, /www\./i, /\.com/i, /\.org/i, /\.net/i, /viagra/i, /casino/i, /bitcoin/i, /crypto/i, /investment/i, /loan/i, /credit/i, /debt/i];
    if (spamPatterns.some((p) => p.test(form.customer_name.toLowerCase()))) {
      toast.error("Submission blocked", { description: "Your submission appears to contain spam content." });
      return;
    }

    const newErrors = {};
    if (!form.customer_name.trim()) newErrors.customer_name = "Name is required";
    if (!form.customer_email.trim()) newErrors.customer_email = "Email is required";
    else if (!validateEmail(form.customer_email)) newErrors.customer_email = "Please enter a valid email address";
    if (!form.customer_phone.trim()) newErrors.customer_phone = "Phone number is required";
    else if (!validatePhone(form.customer_phone)) newErrors.customer_phone = "Please enter a valid phone number";

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); toast.error("Please fix the errors in the form."); return; }

    setSubmitting(true);
    try {
      await api.post("/activations", {
        customer_name: form.customer_name,
        customer_email: form.customer_email,
        customer_phone: form.customer_phone,
        product_key: form.product_key,
        brand: brand.name,
      });
      nav("/activation/thanks");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = (field) =>
    `w-full rounded-md border bg-white py-3 pl-10 pr-4 text-sm focus:ring-2 brand-ring ${errors[field] ? "border-red-500" : "border-neutral-300"}`;

  return (
    <div style={theme} className="bg-neutral-50">
      <SEO
        title={`${brand.name} Activation Assistance — Independent Help | BuyInstantKeys`}
        description={`Free ${brand.name} activation assistance from BuyInstantKeys, an independent reseller. We help you activate the ${brand.name} key you bought from us on the official ${brand.portalName} portal.`}
        keywords={`${brand.name} activation help, ${brand.name} setup assistance, ${brand.name} product key help, independent reseller activation, ${brand.name} install support`}
      />

      {/* Trust badges header strip */}
      <div className="border-b border-neutral-200 bg-white">
        <div className="container-page flex items-center justify-center py-4">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2 text-sm"><ShieldCheck size={18} weight="duotone" className="brand-text" /><span className="font-semibold text-neutral-900">100% Genuine</span></div>
            <div className="hidden sm:block w-px h-5 bg-neutral-200"></div>
            <div className="flex items-center gap-2 text-sm"><Clock size={18} weight="duotone" className="brand-text" /><span className="font-semibold text-neutral-900">Fast Delivery</span></div>
            <div className="hidden sm:block w-px h-5 bg-neutral-200"></div>
            <div className="flex items-center gap-2 text-sm"><Headset size={18} weight="duotone" className="brand-text" /><span className="font-semibold text-neutral-900">Expert Help</span></div>
            <div className="hidden sm:block w-px h-5 bg-neutral-200"></div>
            <div className="flex items-center gap-2 text-sm"><LockKey size={18} weight="duotone" className="brand-text" /><span className="font-semibold text-neutral-900">Secure</span></div>
          </div>
        </div>
      </div>

      {/* Hero — clearly an independent assistance service */}
      <section className="relative overflow-hidden border-b border-neutral-200 brand-bg-softer">
        <div className="container-page py-8 md:py-12">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-700 brand-border">
              <Headset size={14} weight="fill" className="brand-text" /> BuyInstantKeys activation assistance
            </div>
            <h1 className="mt-5 font-display text-3xl font-black leading-[1.05] tracking-tight text-neutral-900 sm:text-4xl lg:text-5xl">
              Need help activating your <span className="relative inline-block"><span className="relative z-10">{brand.name}</span><span className="absolute inset-x-0 bottom-1 z-0 h-3 brand-underline opacity-40" aria-hidden /></span> key?
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-neutral-700">
              We're an independent reseller. Send us your details and our support team will walk you through activating the {brand.name} key you purchased — usually within 5–15 minutes.
            </p>
          </div>
        </div>
      </section>

      {/* Prominent independence notice — required for ad/brand compliance */}
      <div className="border-b border-neutral-200 bg-white">
        <div className="container-page py-4">
          <div className="mx-auto flex max-w-3xl items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-left">
            <ShieldCheck size={20} weight="duotone" className="mt-0.5 shrink-0 brand-text" />
            <p className="text-sm text-neutral-700">
              <strong className="font-semibold text-neutral-900">This is not the official {brand.name} website.</strong>{" "}
              BuyInstantKeys is an independent reseller and is not affiliated with or endorsed by {brand.entity}.
              Activation itself is always completed on the official {brand.name} portal at{" "}
              <a href={brand.portalUrl} target="_blank" rel="noopener noreferrer" className="font-semibold underline">{brand.portalName}</a>.
              This page simply offers free, optional help with that process.
            </p>
          </div>
        </div>
      </div>

      {/* Main split: Form | Instructions */}
      <section className="container-page py-10 md:py-14 lg:py-20">
        <div className="grid gap-8 md:gap-10 lg:grid-cols-2 lg:gap-16">
          {/* LEFT: Activation form */}
          <div id="activation-form" className="order-2 lg:order-1">
            <div className="sticky top-24 rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.15)] sm:p-8">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-lg brand-bg" style={{ color: brand.textOn }}>
                  <Key size={22} weight="duotone" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Free activation assistance</div>
                  <div className="font-display text-xl font-bold">Request help with your {brand.name} key</div>
                </div>
              </div>

              <form onSubmit={submit} className="mt-6 space-y-5">
                {/* Honeypot */}
                <div style={{ display: "none" }}>
                  <label htmlFor="honeypot">Leave this field empty</label>
                  <input id="honeypot" type="text" value={form.honeypot} onChange={(e) => setForm({ ...form, honeypot: e.target.value })} tabIndex={-1} autoComplete="off" />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-600">Full name *</label>
                  <div className="relative mt-1">
                    <User size={18} weight="duotone" className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input data-testid="activation-name-input" required value={form.customer_name} onChange={(e) => { setForm({ ...form, customer_name: e.target.value }); clearError("customer_name"); }} placeholder="John Smith" className={inputCls("customer_name")} />
                  </div>
                  {errors.customer_name && <p className="mt-1 text-xs text-red-600">{errors.customer_name}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-600">Email address *</label>
                  <div className="relative mt-1">
                    <Envelope size={18} weight="duotone" className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input data-testid="activation-email-input" required type="email" value={form.customer_email} onChange={(e) => { setForm({ ...form, customer_email: e.target.value }); clearError("customer_email"); }} placeholder="you@example.com" className={inputCls("customer_email")} />
                  </div>
                  {errors.customer_email && <p className="mt-1 text-xs text-red-600">{errors.customer_email}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-600">Phone number *</label>
                  <div className="relative mt-1">
                    <Phone size={18} weight="duotone" className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input data-testid="activation-phone-input" required type="tel" value={form.customer_phone} onChange={(e) => { setForm({ ...form, customer_phone: e.target.value }); clearError("customer_phone"); }} placeholder="+1 (555) 123-4567" className={inputCls("customer_phone")} />
                  </div>
                  {errors.customer_phone && <p className="mt-1 text-xs text-red-600">{errors.customer_phone}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-600">{brand.keyLabel}</label>
                  <div className="relative mt-1">
                    <Key size={18} weight="duotone" className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input data-testid="activation-key-input" value={form.product_key} onChange={(e) => { setForm({ ...form, product_key: e.target.value.toUpperCase() }); clearError("product_key"); }} placeholder={brand.keyPlaceholder} maxLength={40} className="w-full rounded-md border border-neutral-300 bg-white py-3 pl-10 pr-4 font-mono text-sm tracking-widest focus:ring-2 brand-ring" />
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">{brand.keyHint}</div>
                </div>

                <button data-testid="activation-submit-btn" type="submit" disabled={submitting} className="btn-brand w-full">
                  {submitting ? "Submitting..." : "Submit"}
                  <ArrowRight size={18} weight="bold" />
                </button>

                <div className="mt-4 rounded-lg bg-neutral-50 p-3 text-xs text-neutral-600">
                  <p className="font-semibold mb-1">Terms &amp; Conditions:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>By submitting, you agree to receive activation assistance via email and phone</li>
                    <li>We are an independent reseller and not affiliated with {brand.entity}</li>
                    <li>{brand.name} is a trademark of {brand.entity}</li>
                    <li>Your information is used solely for activation assistance</li>
                    <li>We do not sell or share your personal data with third parties</li>
                  </ul>
                </div>
              </form>

              <div className="mt-6 flex items-center justify-center gap-4 border-t border-neutral-200 pt-4 text-xs text-neutral-600">
                <div className="inline-flex items-center gap-1.5"><ShieldCheck size={14} weight="fill" className="text-emerald-600" /> SSL Secured</div>
                <div className="inline-flex items-center gap-1.5"><CheckCircle size={14} weight="fill" className="text-emerald-600" /> Expert assistance</div>
              </div>
              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-neutral-500">
                <Link to="/privacy-policy" className="hover:text-neutral-900 underline">Privacy Policy</Link>
                <span>·</span>
                <Link to="/terms" className="hover:text-neutral-900 underline">Terms &amp; Conditions</Link>
              </div>
            </div>
          </div>

          {/* RIGHT: Instructions */}
          <div className="order-1 lg:order-2">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">How activation works</div>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Activate on the official {brand.name} site</h2>
            <p className="mt-3 text-neutral-600">Activation always happens on {brand.name}'s official portal. Follow the steps below yourself, or submit your details and our team will guide you through them.</p>

            <ol className="mt-10 space-y-6">
              {brand.steps.map((s, i) => (
                <li key={i} className="relative flex gap-5 rounded-xl border border-neutral-200 bg-white p-5">
                  <div className="flex flex-col items-center">
                    <div className="grid h-11 w-11 place-items-center rounded-lg brand-bg" style={{ color: brand.textOn }}>
                      {STEP_ICONS[i]}
                    </div>
                    <span className="mt-3 font-mono text-xs text-neutral-500">0{i + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-display text-lg font-semibold tracking-tight">{s.title}</div>
                    <p className="mt-1 text-sm leading-relaxed text-neutral-600">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-10 rounded-xl border bg-white p-6 brand-border">
              <div className="flex items-start gap-3">
                <LockKey size={22} weight="duotone" className="mt-1 shrink-0 brand-text" />
                <div>
                  <div className="font-display font-semibold">Where do I find my {brand.name} key?</div>
                  <p className="mt-1 text-sm text-neutral-700">
                    Your product key is in the email we sent after purchase. {brand.keyHint} If you can't find it, <Link to="/contact" className="font-semibold underline">contact us</Link>.
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
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">{brand.name} activation help, made easy</h2>
          </div>
          <div className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-2">
            {brand.faqs.map((f, i) => (
              <div key={i} className="rounded-xl border border-neutral-200 bg-neutral-50 p-5">
                <div className="font-display font-semibold">{f.q}</div>
                <p className="mt-1 text-sm text-neutral-700">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="border-t border-neutral-200 brand-bg-softer py-16">
        <div className="container-page">
          <div className="mx-auto max-w-4xl text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Shop {brand.name}</div>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">Genuine {brand.name} products</h2>
            <p className="mt-3 text-neutral-600">Get genuine {brand.name} software at a discount with instant email delivery.</p>
          </div>
          <div className="mx-auto mt-10 grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              [1, 2, 3].map((i) => <div key={i} className="h-80 animate-pulse rounded-xl bg-neutral-100" />)
            ) : loadError ? (
              <div className="md:col-span-2 lg:col-span-3"><LoadError label={`${brand.name} products`} onRetry={loadProducts} /></div>
            ) : (
              products.map((p) => <ProductCard key={p.id} product={p} />)
            )}
          </div>
          <div className="mt-10 text-center">
            <Link to={`/category/${brand.slug}`} className="btn-brand">
              View all {brand.name} products <ArrowRight size={16} weight="bold" />
            </Link>
          </div>
        </div>
      </section>

      <BrandDisclaimer />
    </div>
  );
}
