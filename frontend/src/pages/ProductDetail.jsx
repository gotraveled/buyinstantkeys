import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import { StarRating } from "@/components/Trust";
import ProductBox from "@/components/ProductBox";
import { ShieldCheck, Check, ArrowRight, Envelope, LockKey, Monitor, Cloud, Warning, Lightning, Users, Globe, DeviceMobile, Laptop, Play, Question, ShoppingCart, CreditCard } from "@phosphor-icons/react";

export default function ProductDetail() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [variantId, setVariantId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/products/${slug}`).then((r) => {
      setProduct(r.data);
      setVariantId(r.data.variants[0]?.id || null);
    }).catch(() => {
      toast.error("Product not found");
      nav("/products");
    }).finally(() => setLoading(false));
  }, [slug, nav]);

  if (loading || !product) {
    return <div className="container-page py-20"><div className="h-96 animate-pulse rounded-xl bg-neutral-100" /></div>;
  }

  const variant = product.variants.find((v) => v.id === variantId) || product.variants[0];
  const savings = variant.original_price && variant.original_price > variant.price
    ? Math.round(((variant.original_price - variant.price) / variant.original_price) * 100)
    : 0;

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
      "name": "Norton"
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
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "340"
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
        "name": "How do I activate my Norton license key?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "After purchase, you'll receive your 25-character license key via email within 5-15 minutes. Visit my.norton.com, sign in or create an account, click 'Enter a product key', paste your key, and follow the on-screen instructions to download and install."
        }
      },
      {
        "@type": "Question",
        "name": "Is this a genuine Norton license?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, all our Norton license keys are 100% genuine and legally acquired from trusted channels. Each key is verified before delivery to ensure validity."
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
        description={`${product.description} Get ${product.name} at ${savings > 0 ? savings + '% off' : 'best price'}. Instant email delivery, 100% genuine Norton license key, 30-day money-back guarantee.`}
        keywords={`${product.name}, ${product.category}, Norton 360 Deluxe with LifeLock, Norton license key, ${product.tagline}, genuine Norton software, cheap Norton ${product.category}, buy ${product.name} online`}
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
                {["Genuine key", "Instant delivery", "Secure checkout"][i]}
              </div>
            ))}
          </div>
        </div>

        <div>
          {product.badge && <span className="badge-hot mb-3">{product.badge}</span>}
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">{product.category}</div>
          <h1 data-testid="product-name" className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">{product.name}</h1>
          <p className="mt-3 text-lg text-neutral-600">{product.tagline}</p>
          <div className="mt-3"><StarRating rating={4.9} reviews={340} /></div>

          <div className="mt-8">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Select plan</div>
            <div className="mt-3 space-y-2">
              {product.variants.map((v) => {
                const active = v.id === variantId;
                const orig = v.original_price;
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
                        {orig && orig > v.price && <div className="text-xs text-neutral-500 line-through">${orig.toFixed(2)}</div>}
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
            {variant.original_price && variant.original_price > variant.price && (
              <>
                <span className="text-lg text-neutral-500 line-through">${variant.original_price.toFixed(2)}</span>
                <span className="badge-trust">Save {savings}%</span>
              </>
            )}
          </div>

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

          <div className="mt-10 rounded-xl border border-neutral-200 bg-neutral-50 p-6">
            <h3 className="font-display text-base font-semibold">Description</h3>
            <p className="mt-2 text-sm text-neutral-700">{product.description}</p>
          </div>
        </div>
      </div>

      {/* Product Overview Section */}
      <section className="mt-16">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight">Why Choose {product.name}?</h2>
          <p className="mt-4 text-lg text-neutral-600">Comprehensive protection for your digital life with advanced security features</p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {[
            { icon: <ShieldCheck size={32} weight="duotone" />, title: "Advanced Protection", desc: "Real-time threat detection against viruses, malware, ransomware, and phishing attacks." },
            { icon: <Cloud size={32} weight="duotone" />, title: "Cloud Backup", desc: "Secure cloud storage to protect your important files and documents from data loss." },
            { icon: <Monitor size={32} weight="duotone" />, title: "Multi-Device Coverage", desc: "Protect all your devices including PC, Mac, iOS, and Android with one subscription." },
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
            { n: "03", icon: <Envelope size={24} weight="duotone" />, title: "Instant Delivery", desc: "Receive your license key via email within 5-15 minutes." },
            { n: "04", icon: <Lightning size={24} weight="duotone" />, title: "Activate & Protect", desc: "Activate your key on my.norton.com and enjoy full protection." },
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
          <p className="mt-3 text-neutral-600">Compatible with all major operating systems and devices</p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: <Monitor size={28} weight="duotone" />, title: "Windows", desc: "Windows 10/11 (all versions)" },
              { icon: <Laptop size={28} weight="duotone" />, title: "macOS", desc: "macOS X 10.15 or later" },
              { icon: <DeviceMobile size={28} weight="duotone" />, title: "Android", desc: "Android 8.0 or later" },
              { icon: <DeviceMobile size={28} weight="duotone" />, title: "iOS", desc: "iOS 14 or later" },
            ].map((req, i) => (
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
            { q: "How do I activate my Norton license key?", a: "After purchase, you'll receive your 25-character license key via email within 5-15 minutes. Visit my.norton.com, sign in or create an account, click 'Enter a product key', paste your key, and follow the on-screen instructions to download and install." },
            { q: "Is this a genuine Norton license?", a: "Yes, all our Norton license keys are 100% genuine and legally acquired from trusted channels. Each key is verified before delivery to ensure validity and proper activation." },
            { q: "What is your refund policy?", a: "We offer a 30-day money-back guarantee. If your license key cannot be activated or you received the wrong product, we'll issue a full refund or replacement within 30 days of purchase." },
            { q: "Can I use this on multiple devices?", a: `Yes, this plan covers ${variant.devices === 999 ? 'unlimited' : variant.devices} device(s) for ${variant.years} year(s). You can install and activate on all supported devices including Windows, Mac, iOS, and Android.` },
            { q: "How long does delivery take?", a: "License keys are delivered instantly via email within 5-15 minutes after payment confirmation. In rare cases, it may take up to 24 hours for manual verification." },
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
          <p className="mt-3 text-neutral-300">Trusted by thousands of customers worldwide</p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: <ShieldCheck size={32} weight="duotone" />, title: "100% Genuine Keys", desc: "All keys are verified and authentic" },
              { icon: <Envelope size={32} weight="duotone" />, title: "Instant Delivery", desc: "Email delivery within 5-15 minutes" },
              { icon: <LockKey size={32} weight="duotone" />, title: "Secure Payment", desc: "Protected by PayPal encryption" },
              { icon: <Users size={32} weight="duotone" />, title: "24/7 Service", desc: "Customer service always available" },
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
      <section className="mt-16">
        <h2 className="font-display text-2xl font-bold tracking-tight">You May Also Like</h2>
        <p className="mt-2 text-neutral-600">Explore other Norton products for complete protection</p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* This would typically show related products from API */}
          <div className="rounded-xl border border-neutral-200 bg-white p-6 text-center">
            <div className="text-sm font-medium text-neutral-500">More products coming soon</div>
          </div>
        </div>
      </section>
    </div>
    </>
  );
}
