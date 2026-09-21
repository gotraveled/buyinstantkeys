import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import SEO from "@/components/SEO";
import ProductCard from "@/components/ProductCard";
import BrandDisclaimer from "@/components/BrandDisclaimer";
import { getBrand, BRAND_LIST } from "@/lib/brands";
import { ShieldCheck, ArrowRight, CheckCircle, Envelope, LockKey, Headset } from "@phosphor-icons/react";

export default function CategoryPage() {
  const { category } = useParams();
  const brand = getBrand(category);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!brand) { setLoading(false); return; }
    setLoading(true);
    api.get("/products", { params: { brand: brand.name } })
      .then((r) => setProducts(r.data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [category, brand]);

  // Unknown brand -> friendly fallback
  if (!brand) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="font-display text-3xl font-bold">Category not found</h1>
        <p className="mt-3 text-neutral-600">Browse our security software by brand:</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {BRAND_LIST.map((b) => (
            <Link key={b.slug} to={`/category/${b.slug}`} className="btn-outline">{b.name}</Link>
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

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://buyinstantkeys.com" },
      { "@type": "ListItem", "position": 2, "name": "Products", "item": "https://buyinstantkeys.com/products" },
      { "@type": "ListItem", "position": 3, "name": brand.heroTitle, "item": `https://buyinstantkeys.com/category/${brand.slug}` },
    ],
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": brand.heroTitle,
    "itemListElement": products.map((p, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": p.name,
      "url": `https://buyinstantkeys.com/product/${p.slug}`,
    })),
  };

  return (
    <>
      <SEO
        title={brand.seoTitle}
        description={brand.seoDesc}
        keywords={brand.seoKeywords}
        schema={[breadcrumbSchema, itemListSchema]}
      />
      <div style={theme} className="bg-white">
        {/* Hero */}
        <section className="border-b border-neutral-200 brand-bg-softer">
          <div className="container-page py-12 md:py-16">
            <div className="mb-4 text-sm text-neutral-500">
              <Link to="/products" className="hover:text-neutral-900">Products</Link>
              <span className="mx-1.5">/</span>
              <span className="text-neutral-900">{brand.name}</span>
            </div>
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-700 brand-border">
                <ShieldCheck size={14} weight="fill" className="brand-text" /> Genuine {brand.name} keys
              </div>
              <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight text-neutral-900 sm:text-5xl">
                {brand.heroTitle}
              </h1>
              <div className="mt-3 h-1.5 w-24 rounded-full brand-underline" />
              <p className="mt-5 text-lg leading-relaxed text-neutral-700">{brand.heroSub}</p>
              <p className="mt-2 text-sm text-neutral-500">{brand.tagline}.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link to={`/activation/${brand.slug}`} className="btn-brand">
                  Activate a {brand.name} key <ArrowRight size={18} weight="bold" />
                </Link>
                <Link to="/products" className="btn-outline">All products</Link>
              </div>
            </div>
          </div>
        </section>

        {/* Trust strip */}
        <section className="border-b border-neutral-200 bg-white">
          <div className="container-page flex flex-wrap items-center justify-center gap-x-8 gap-y-3 py-4 text-sm">
            {[
              { icon: <ShieldCheck size={16} weight="duotone" className="brand-text" />, t: "100% genuine keys" },
              { icon: <Envelope size={16} weight="duotone" className="brand-text" />, t: "Email delivery in 5–15 min" },
              { icon: <LockKey size={16} weight="duotone" className="brand-text" />, t: "Secure checkout" },
              { icon: <Headset size={16} weight="duotone" className="brand-text" />, t: "Free activation help" },
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-2 font-medium text-neutral-800">{b.icon}{b.t}</div>
            ))}
          </div>
        </section>

        {/* Products */}
        <section className="container-page py-14 md:py-20">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">{products.length} products</div>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">Shop {brand.name}</h2>
            </div>
          </div>
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-80 animate-pulse rounded-xl bg-neutral-100" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-neutral-300 p-16 text-center text-neutral-600">
              No {brand.name} products found. <Link to="/products" className="font-semibold underline">Browse all products</Link>
            </div>
          )}
        </section>

        {/* About + FAQ (compliant, informative content) */}
        <section className="border-t border-neutral-200 brand-bg-softer py-16">
          <div className="container-page">
            <div className="mx-auto max-w-3xl">
              <h2 className="font-display text-3xl font-bold tracking-tight">About {brand.name} security</h2>
              <div className="mt-5 space-y-4 text-neutral-700">
                {brand.about.map((para, i) => <p key={i}>{para}</p>)}
              </div>

              <div className="mt-10">
                <h3 className="font-display text-xl font-semibold">Frequently asked questions</h3>
                <div className="mt-4 space-y-3">
                  {brand.faqs.map((f, i) => (
                    <div key={i} className="rounded-xl border bg-white p-5 brand-border">
                      <div className="font-display font-semibold text-neutral-900">{f.q}</div>
                      <p className="mt-1.5 text-sm text-neutral-600">{f.a}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-10 rounded-xl border bg-white p-6 brand-border">
                <div className="flex items-start gap-3">
                  <CheckCircle size={22} weight="duotone" className="mt-0.5 shrink-0 brand-text" />
                  <div>
                    <div className="font-display font-semibold">Need help activating {brand.name}?</div>
                    <p className="mt-1 text-sm text-neutral-700">
                      Our team provides free activation assistance for keys purchased from us.{" "}
                      <Link to={`/activation/${brand.slug}`} className="font-semibold underline brand-text">
                        Get {brand.name} activation help
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <BrandDisclaimer />
      </div>
    </>
  );
}
