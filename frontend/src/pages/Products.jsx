import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import SEO from "@/components/SEO";
import ProductCard from "@/components/ProductCard";
import LoadError from "@/components/LoadError";
import { BRAND_LIST } from "@/lib/brands";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [params, setParams] = useSearchParams();
  const brand = params.get("brand");

  const load = () => {
    setLoading(true);
    setError(false);
    api.get("/products", { params: brand ? { brand } : {} })
      .then((r) => setProducts(r.data))
      .catch(() => { setProducts([]); setError(true); })
      .finally(() => setLoading(false));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [brand]);

  const activeBrand = BRAND_LIST.find((b) => b.name === brand);
  const pageTitle = activeBrand ? `${activeBrand.name} Products` : "All Antivirus Products";
  const pageDesc = activeBrand
    ? `Browse genuine ${activeBrand.name} security software with fast email delivery and a 30-day money-back guarantee.`
    : "Browse our full catalog of genuine antivirus license keys — Norton, Webroot and McAfee — with fast email delivery and a 30-day money-back guarantee.";

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://buyinstantkeys.com" },
      { "@type": "ListItem", "position": 2, "name": pageTitle, "item": `https://buyinstantkeys.com/products${brand ? "?brand=" + brand : ""}` },
    ],
  };

  return (
    <>
      <SEO
        title={pageTitle}
        description={pageDesc}
        keywords={`${brand || "antivirus"}, Norton key, Webroot keycode, McAfee activation code, antivirus license key, genuine software keys, email delivery`}
        schema={[breadcrumbSchema]}
      />
      <div className="container-page py-10 md:py-14">
        <div className="mb-6 md:mb-8">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Catalog</div>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">{pageTitle}</h1>
          <p className="mt-3 max-w-2xl text-neutral-600">{pageDesc}</p>
        </div>

        {/* Brand filter tabs */}
        <div className="mb-6 md:mb-8 flex flex-wrap gap-2">
          <button
            data-testid="filter-all"
            onClick={() => setParams({})}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              !brand ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-900"
            }`}
          >
            All
          </button>
          {BRAND_LIST.map((b) => {
            const active = brand === b.name;
            return (
              <button
                key={b.slug}
                data-testid={`filter-${b.slug}`}
                onClick={() => setParams({ brand: b.name })}
                className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  active ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-900"
                }`}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: active ? "#fff" : b.color }} />
                {b.name}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 animate-pulse rounded-xl bg-neutral-100" />
            ))}
          </div>
        ) : error ? (
          <LoadError label="products" onRetry={load} />
        ) : products.length > 0 ? (
          <div data-testid="products-grid" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (<ProductCard key={p.id} product={p} />))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-neutral-300 p-16 text-center text-neutral-600">
            No products found. <Link to="/products" className="font-semibold underline">View all</Link>
          </div>
        )}
      </div>
    </>
  );
}
