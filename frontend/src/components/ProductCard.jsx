import { Link } from "react-router-dom";
import { ShieldCheck, Star } from "@phosphor-icons/react";
import ProductBox from "@/components/ProductBox";

export default function ProductCard({ product }) {
  const minPrice = Math.min(...product.variants.map((v) => v.price));
  const maxOrig = Math.max(...product.variants.map((v) => v.original_price || v.price));
  const savings = maxOrig > minPrice ? Math.round(((maxOrig - minPrice) / maxOrig) * 100) : 0;
  return (
    <Link to={`/product/${product.slug}`} data-testid={`product-card-${product.slug}`} className="card-product group block p-6">
      <div className="h-48"><ProductBox product={product} size="md" /></div>
      <div className="mt-5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
        <ShieldCheck size={14} weight="fill" className="text-emerald-600" /> {product.category}
      </div>
      <h3 className="mt-2 font-display text-lg font-semibold tracking-tight">{product.name}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{product.tagline}</p>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <div className="text-xs text-neutral-500">Starting at</div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold">${minPrice.toFixed(2)}</span>
            {savings > 0 && <span className="text-xs font-semibold text-emerald-700">Save {savings}%</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-neutral-500">
          <Star size={12} weight="fill" className="text-yellow-500" /> 4.9
        </div>
      </div>
    </Link>
  );
}
