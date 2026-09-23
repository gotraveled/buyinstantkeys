import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import ProductCard from "@/components/ProductCard";
import ProductBox from "@/components/ProductBox";
import { getBrand } from "@/lib/brands";
import { ShieldCheck, Check, ArrowRight, Envelope, LockKey, Monitor, Cloud, Warning, Lightning, Users, Globe, DeviceMobile, Laptop, Play, Question, ShoppingCart, CreditCard } from "@phosphor-icons/react";

export default function ProductDetail() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [variantId, setVariantId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    setLoading(true);
    api.get(`/products/${slug}`).then((r) => {
      setProduct(r.data);
      setVariantId(r.data.variants[0]?.id || null);
      // fetch related products from the same brand
      api.get("/products", { params: { brand: r.data.brand } })
        .then((rel) => setRelated(rel.data.filter((x) => x.slug !== slug).slice(0, 3)))
        .catch(() => {});
    }).catch(() => {
      toast.error("Product not found");
      nav("/products");
    }).finally(() => setLoading(false));
  }, [slug, nav]);

  if (loading || !product) {
    return <div className="container-page py-20"><div className="h-96 animate-pulse rounded-xl bg-neutral-100" /></div>;
  }

  const variant = product.variants.find((v) => v.id === variantId) || product.variants[0];
  const brand = getBrand((product.brand || "").toLowerCase());
  const brandName = product.brand || "Antivirus";
  const portal = brand?.portalName || "the official site";
  // Long-form description split into paragraphs (falls back to short description).
  const longParas = (product.long_description || product.description || "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const hasBackup = product.features.some((f) => /cloud backup|secure cloud backup/i.test(f));
  const isWindowsOnly = product.platforms && product.platforms.length === 1 && product.platforms[0] === "windows";
  const isMobileOnly = product.platforms && product.platforms.length === 2 && product.platforms.includes("android") && product.platforms.includes("ios");
  const platformLabels = {
    windows: { icon: <Monitor size={28} weight="duotone" />, title: "Windows", desc: "Windows 10 / 11 (64-bit)" },
    macos: { icon: <Laptop size={28} weight="duotone" />, title: "macOS", desc: "macOS 10.15 (Catalina) or later" },
    android: { icon: <DeviceMobile size={28} weight="duotone" />, title: "Android", desc: "Android 8.0 (Oreo) or later" },
    ios: { icon: <DeviceMobile size={28} weight="duotone" />, title: "iOS", desc: "iOS 14 or later" },
    chromeos: { icon: <Monitor size={28} weight="duotone" />, title: "Chromebook", desc: "ChromeOS (modern Chromebooks)" },
  };
  const platformCards = (product.platforms || ["windows", "macos", "android", "ios"])
    .filter((p) => platformLabels[p])
    .map((p) => platformLabels[p]);

  const handleAdd = (goCheckout = false) => {
    addItem(product, variant, 1);
    toast.success("Added to cart", { description: `${product.name} · ${variant.label}` });
    if (goCheckout) nav("/cart");
  };

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": product.image_url || "https://buyinstantkeys.com/products/default.jpg",
    "brand": {
      "@type": "Brand",
      "name": brandName
    },
    "offers": {
      "@type": "Offer",
      "url": `https://buyinstantkeys.com/product/${product.slug}`,
      "priceCurrency": "USD",
      "price": variant.price,
      "priceValidUntil": "2026-12-31",
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "BuyInstantKeys",
        "url": "https://buyinstantkeys.com"
      }
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `What is included in ${product.name}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": product.features.join(", ")
        }
      },
      {
        "@type": "Question",
        "name": `How do I activate my ${brandName} license key?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `After purchase, you'll receive your license key via email within 5-15 minutes. Visit ${portal}, sign in or create an account, enter your product key, and follow the on-screen instructions to download and install.`
        }
      },
      {
        "@type": "Question",
        "name": `Is this a genuine ${brandName} license?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Yes, all our ${brandName} license keys are 100% genuine and legally acquired from trusted channels. Each key is verified before delivery to ensure validity.`
        }
      },
      {
        "@type": "Question",
        "name": "What is your refund policy?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We offer a 30-day money-back guarantee. If your license key cannot be activated or you received the wrong product, we'll issue a full refund or replacement."
        }
      }
    ]
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://buyinstantkeys.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Products",
        "item": "https://buyinstantkeys.com/products"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": product.name,
        "item": `https://buyinstantkeys.com/product/${product.slug}`
      }
    ]
  };

  return (
    <>
      <SEO
        title={`${product.name} - ${variant.label} | BuyInstantKeys`}
        description={`${product.description} Buy ${product.name} with fast email delivery, a genuine ${brandName} license key, and a 30-day money-back guarantee.`}
        keywords={`${product.name}, ${product.category}, ${brandName} license key, ${product.tagline}, genuine ${brandName} software, buy ${product.name} online`}
        ogType="product"
        schema={[productSchema, breadcrumbSchema, faqSchema]}
      />
      <div className="container-page py-14">
      <div className="mb-6 text-sm text-neutral-500">
        <Link to="/products" className="hover:text-neutral-900">Products</Link> / <span className="text-neutral-900">{product.name}</span>
      </div>
      <div className="grid gap-12 lg:grid-cols-2">
        <div>
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
            <div className="h-[440px]"><ProductBox product={product} variant={variant} size="lg" /></div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[<ShieldCheck size={20} weight="duotone" />, <Envelope size={20} weight="duotone" />, <LockKey size={20} weight="duotone" />].map((icon, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white p-3 text-xs font-medium text-neutral-700">
                <div className="text-neutral-900">{icon}</div>
                {["Genuine key", "Fast delivery", "Secure checkout"][i]}
              </div>
            ))}
          </div>

        </div>

        <div>
          {product.badge && <span className="badge-hot mb-3">{product.badge}</span>}
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">{product.category}</div>
          <h1 data-testid="product-name" className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">{product.name}</h1>
          <p className="mt-3 text-lg text-neutral-600">{product.tagline}</p>

          <div className="mt-8">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Select plan</div>
            <div className="mt-3 space-y-2">
              {product.variants.map((v) => {
                const active = v.id === variantId;
                return (
                  <button
                    key={v.id}
                    data-testid={`variant-${v.id}`}
                    onClick={() => setVariantId(v.id)}
                    className={`flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors ${
                      active ? "border-neutral-900 bg-yellow-50" : "border-neutral-200 bg-white hover:border-neutral-400"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`grid h-5 w-5 place-items-center rounded-full border-2 ${active ? "border-neutral-900 bg-neutral-900 text-[#FCE029]" : "border-neutral-300"}`}>
                        {active && <Check size={12} weight="bold" />}
                      </div>
                      <div>
                        <div className="font-semibold">{v.label}</div>
                      </div>
                    </div>
                    <div className="font-display text-lg font-bold">${v.price.toFixed(2)}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8 flex items-baseline gap-3">
            <span data-testid="product-price" className="font-display text-4xl font-bold">${variant.price.toFixed(2)}</span>
            <span className="text-sm text-neutral-500">one-time · {variant.years} yr{variant.years > 1 ? 's' : ''}</span>
          </div>
          {variant.original_price > variant.price && (
            <div className="mt-1.5 text-sm text-neutral-500">
              Retail price <span className="line-through">${variant.original_price.toFixed(2)}</span>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button data-testid="add-to-cart-btn" onClick={() => handleAdd(false)} className="btn-outline">Add to cart</button>
            <button data-testid="buy-now-btn" onClick={() => handleAdd(true)} className="btn-primary">
              Buy now <ArrowRight size={18} weight="bold" />
            </button>
          </div>

          <div className="mt-10">
            <h3 className="font-display text-lg font-semibold">What's included</h3>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {product.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-neutral-700">
                  <Check size={16} weight="bold" className="mt-0.5 shrink-0 text-emerald-600" /> {f}
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* Full-width description fills the gap below product info */}
      <div className="mt-12 rounded-xl border border-neutral-200 bg-neutral-50 p-6 md:p-8">
        <h3 className="font-display text-base font-semibold">About {product.name}</h3>
        <div className="mt-3 space-y-3">
          {longParas.map((para, i) => (
            <p key={i} className="text-sm leading-relaxed text-neutral-700">{para}</p>
          ))}
        </div>
      </div>

      {/* Product Overview Section */}
      <section className="mt-16">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight">Why Choose {product.name}?</h2>
          <p className="mt-4 text-lg text-neutral-600">
            {product.slug.includes("utilities")
              ? "Clean, tune and speed up your Windows PCs with an all-in-one optimization toolkit"
              : product.slug.includes("vpn")
              ? "Browse privately and securely on public Wi-Fi with bank-grade encryption"
              : "Comprehensive protection for your devices, identity and online privacy"}
          </p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {[
            product.slug.includes("utilities")
              ? { icon: <Lightning size={32} weight="duotone" />, title: "PC Optimization", desc: "Removes junk files, fixes registry issues and optimizes startup for faster boot times." }
              : product.slug.includes("vpn")
              ? { icon: <Globe size={32} weight="duotone" />, title: "Private Browsing", desc: "Encrypts your connection and masks your IP address on public Wi-Fi networks." }
              : { icon: <ShieldCheck size={32} weight="duotone" />, title: "Advanced Threat Protection", desc: "Real-time detection and blocking of viruses, malware, ransomware and phishing." },
            hasBackup
              ? { icon: <Cloud size={32} weight="duotone" />, title: "Cloud Backup", desc: "Included cloud storage helps keep your important files safe from ransomware or loss." }
              : product.slug.includes("utilities")
              ? { icon: <Monitor size={32} weight="duotone" />, title: "Windows PC Coverage", desc: "Designed for Microsoft Windows PCs, laptops and tablets." }
              : { icon: <LockKey size={32} weight="duotone" />, title: "Privacy & Identity", desc: "Tools that keep your passwords, browsing and personal details away from prying eyes." },
            isWindowsOnly
              ? { icon: <Monitor size={32} weight="duotone" />, title: "Windows PC Coverage", desc: "Built to protect Windows desktop and laptop computers with one subscription." }
              : isMobileOnly
              ? { icon: <DeviceMobile size={32} weight="duotone" />, title: "Mobile Coverage", desc: "Protects Android and iOS smartphones and tablets from mobile-specific threats." }
              : { icon: <Monitor size={32} weight="duotone" />, title: "Multi-Device Coverage", desc: "One subscription protects PCs, Macs and mobile devices across your household." },
          ].map((item, i) => (
            <div key={i} className="rounded-xl border border-neutral-200 bg-white p-6 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-neutral-100 text-neutral-900">{item.icon}</div>
              <h3 className="mt-4 font-display text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-neutral-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

{/* Features Section */}
      <section className="mt-16">
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-8 md:p-12">
          <h2 className="font-display text-2xl font-bold tracking-tight">Key Features & Benefits</h2>
          <p className="mt-3 text-neutral-600">Everything you need for complete digital security and peace of mind</p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {product.features.map((feature, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                  <Check size={14} weight="bold" />
                </div>
                <span className="text-sm font-medium text-neutral-800">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="mt-16">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight">How It Works</h2>
          <p className="mt-4 text-lg text-neutral-600">Get protected in 4 simple steps</p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-4">
          {[
            { n: "01", icon: <ShoppingCart size={24} weight="duotone" />, title: "Choose Your Plan", desc: "Select the perfect plan for your needs and device count." },
            { n: "02", icon: <CreditCard size={24} weight="duotone" />, title: "Secure Checkout", desc: "Complete your purchase with our secure PayPal checkout." },
            { n: "03", icon: <Envelope size={24} weight="duotone" />, title: "Fast Delivery", desc: "Receive your license key via email within 5-15 minutes." },
            { n: "04", icon: <Lightning size={24} weight="duotone" />, title: "Activate & Protect", desc: `Activate your key at ${portal} and enjoy full protection.` },
          ].map((step, i) => (
            <div key={i} className="text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-neutral-900 text-[#FCE029] font-mono text-sm font-bold">{step.n}</div>
              <div className="mt-4 mx-auto grid h-10 w-10 place-items-center rounded-full bg-neutral-100 text-neutral-900">{step.icon}</div>
              <h3 className="mt-3 font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-neutral-600">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* System Requirements Section */}
      <section className="mt-16">
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 md:p-12">
          <h2 className="font-display text-2xl font-bold tracking-tight">System Requirements</h2>
          <p className="mt-3 text-neutral-600">
            {platformCards.length > 0
              ? `Compatible with ${platformCards.map((p) => p.title).join(", ")}`
              : "Compatible with supported operating systems"}
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {platformCards.map((req, i) => (
              <div key={i} className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white text-neutral-900">{req.icon}</div>
                <h3 className="mt-3 font-semibold">{req.title}</h3>
                <p className="mt-1 text-xs text-neutral-600">{req.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

{/* FAQ Section */}
      <section className="mt-16">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight">Frequently Asked Questions</h2>
          <p className="mt-4 text-lg text-neutral-600">Everything you need to know about {product.name}</p>
        </div>
        <div className="mt-12 max-w-3xl mx-auto space-y-4">
          {[
            { q: `What is included in ${product.name}?`, a: `${product.name} includes ${product.features.slice(0, 3).join(", ")}, and many more advanced security features to keep your devices and data protected.` },
            { q: `How do I activate my ${brandName} license key?`, a: `After purchase, you'll receive your license key via email within 5-15 minutes. Visit ${portal}, sign in or create an account, enter your product key, and follow the on-screen instructions to download and install.` },
            { q: `Is this a genuine ${brandName} license?`, a: `Yes, all our ${brandName} license keys are 100% genuine and legally acquired from trusted channels. Each key is verified before delivery to ensure validity and proper activation.` },
            { q: "What is your refund policy?", a: "We offer a 30-day money-back guarantee. If your license key cannot be activated or you received the wrong product, we'll issue a full refund or replacement within 30 days of purchase." },
            { q: "Can I use this on multiple devices?", a: `Yes, this plan covers ${variant.devices === 999 ? 'unlimited' : variant.devices} device(s) for ${variant.years} year(s). You can install and activate on the supported platforms listed above.` },
            { q: "How long does delivery take?", a: "License keys are delivered by email within 5-15 minutes after payment confirmation. In rare cases, it may take up to 24 hours for manual verification." },
          ].map((faq, i) => (
            <div key={i} className="rounded-xl border border-neutral-200 bg-white">
              <details className="group">
                <summary className="flex cursor-pointer items-center justify-between p-6 font-semibold">
                  <span className="flex items-center gap-3">
                    <Question size={20} weight="duotone" className="text-neutral-500" />
                    {faq.q}
                  </span>
                  <span className="transition-transform group-open:rotate-180">
                    <ArrowRight size={20} weight="bold" className="rotate-90" />
                  </span>
                </summary>
                <div className="px-6 pb-6 pt-0">
                  <p className="text-neutral-600 pl-8">{faq.a}</p>
                </div>
              </details>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Badges Section */}
      <section className="mt-16">
        <div className="rounded-2xl bg-neutral-900 p-8 md:p-12 text-center">
          <h2 className="font-display text-2xl font-bold text-white">Why Buy From BuyInstantKeys?</h2>
          <p className="mt-3 text-neutral-300">Genuine keys, fast delivery, real service</p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: <ShieldCheck size={32} weight="duotone" />, title: "Genuine Keys", desc: "All keys are verified and authentic" },
              { icon: <Envelope size={32} weight="duotone" />, title: "Fast Delivery", desc: "Email delivery within 5-15 minutes" },
              { icon: <LockKey size={32} weight="duotone" />, title: "Secure Payment", desc: "Protected by PayPal encryption" },
              { icon: <Users size={32} weight="duotone" />, title: "Customer Service", desc: "Responsive service on every order" },
            ].map((badge, i) => (
              <div key={i} className="text-white">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-neutral-800 text-[#FCE029]">{badge.icon}</div>
                <h3 className="mt-4 font-semibold">{badge.title}</h3>
                <p className="mt-2 text-sm text-neutral-400">{badge.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold tracking-tight">You May Also Like</h2>
          <p className="mt-2 text-neutral-600">Explore other {brandName} products for complete protection</p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
    </>
  );
}
