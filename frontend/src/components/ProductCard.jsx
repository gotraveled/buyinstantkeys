import { Link } from "react-router-dom";
import { ShieldCheck, Star, CheckCircle } from "@phosphor-icons/react";

export default function ProductCard({ product }) {
  const minPrice = Math.min(...product.variants.map((v) => v.price));
  const maxOrig = Math.max(...product.variants.map((v) => v.original_price || v.price));
  const savings = maxOrig > minPrice ? Math.round(((maxOrig - minPrice) / maxOrig) * 100) : 0;
  return (
    <Link to={`/product/${product.slug}`} data-testid={`product-card-${product.slug}`} className="card-product group block p-6">
      {product.badge && (
        <div className="absolute right-4 top-4 z-10">
          <span className="badge-hot">{product.badge}</span>
        </div>
      )}
      <div className="flex h-40 items-center justify-center overflow-hidden rounded-lg bg-neutral-50">
        <img src={product.image_url} alt={product.name} className="h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105" />
      </div>
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
