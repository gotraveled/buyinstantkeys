import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import SEO from "@/components/SEO";
import ProductCard from "@/components/ProductCard";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useSearchParams();
  const category = params.get("category");

  useEffect(() => {
    setLoading(true);
    api.get("/products", { params: category ? { category } : {} })
      .then((r) => setProducts(r.data))
      .finally(() => setLoading(false));
  }, [category]);

  const categories = useMemo(() => {
    const s = new Set();
    products.forEach((p) => s.add(p.category));
    return Array.from(s);
  }, [products]);

  const allCategories = ["All", "Norton 360", "AntiVirus", "Privacy", "Utilities", "Family", "Business", "Gaming", "Mobile"];

  const categoryTitle = category ? `${category} Products` : "All Norton Products";
  const categoryDescription = category 
    ? `Browse our ${category} collection. Genuine Norton ${category} software at up to 70% off retail with instant email delivery.`
    : "Browse our complete Norton product catalog. Norton 360, LifeLock, VPN, AntiVirus and more at up to 70% off retail.";

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
        "name": categoryTitle,
        "item": `https://buyinstantkeys.com/products${category ? '?category=' + category : ''}`
      }
    ]
  };

  return (
    <>
      <SEO
        title={categoryTitle}
        description={categoryDescription}
        keywords={`${category || 'Norton products'}, Norton 360 Deluxe with LifeLock, Norton license keys, ${category || 'Norton antivirus, Norton VPN, LifeLock'}, genuine Norton software, cheap Norton keys`}
        schema={[breadcrumbSchema]}
      />
      <div className="container-page py-14">
      <div className="mb-8">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Catalog</div>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">All Norton products</h1>
        <p className="mt-3 max-w-2xl text-neutral-600">Choose from our full range of Norton security software with instant email delivery.</p>
      </div>
      <div className="mb-8 flex flex-wrap gap-2">
        {allCategories.map((c) => {
          const active = (c === "All" && !category) || c === category;
          return (
            <button
              key={c}
              data-testid={`filter-${c.replace(/\s+/g, "-").toLowerCase()}`}
              onClick={() => {
                if (c === "All") setParams({});
                else setParams({ category: c });
              }}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-900"
              }`}
            >
              {c}
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
      ) : (
        <div data-testid="products-grid" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (<ProductCard key={p.id} product={p} />))}
        </div>
      )}
      {!loading && products.length === 0 && (
        <div className="rounded-xl border border-dashed border-neutral-300 p-16 text-center text-neutral-600">
          No products found in this category.
        </div>
      )}
    </div>
    </>
  );
}
