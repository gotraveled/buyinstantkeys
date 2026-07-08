import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import { StarRating } from "@/components/Trust";
import ProductBox from "@/components/ProductBox";
import { ShieldCheck, Check, ArrowRight, Envelope, LockKey } from "@phosphor-icons/react";

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
      "priceValidUntil": "2025-12-31",
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
        keywords={`${product.name}, ${product.category}, Norton 360 Deluxe with LifeLock, Norton license key, ${product.tagline}, genuine Norton software, cheap Norton ${product.category}`}
        ogType="product"
        schema={[productSchema, breadcrumbSchema]}
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
    </div>
    </>
  );
}
