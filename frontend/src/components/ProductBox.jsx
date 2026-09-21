import { useEffect, useState } from "react";
import { ShieldCheck } from "@phosphor-icons/react";

const slugify = (s) =>
  (s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/**
 * Renders the generated product-box image for a product/variant.
 * Images live at /images/products/{slug}--{variant-label-slug}.svg with a
 * per-product fallback at /images/products/{slug}.svg. If neither exists,
 * a clean neutral placeholder is shown.
 */
export default function ProductBox({ product, variant, size = "md", showRibbon = true }) {
  const activeVariant = variant || product?.variants?.[0] || {};
  const slug = product?.slug || slugify(product?.name) || "product";
  const vslug = slugify(activeVariant.label);

  const candidates = [
    vslug ? `/images/products/${slug}--${vslug}.svg` : null,
    `/images/products/${slug}.svg`,
  ].filter(Boolean);

  const [idx, setIdx] = useState(0);
  useEffect(() => setIdx(0), [slug, vslug]);

  const failed = idx >= candidates.length;
  const src = candidates[Math.min(idx, candidates.length - 1)];

  return (
    <div
      data-testid={`product-box-${slug}`}
      className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-white"
    >
      {!failed ? (
        <img
          src={src}
          alt={product?.name || "Product"}
          onError={() => setIdx((i) => i + 1)}
          loading="lazy"
          className="h-full w-full object-contain"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-neutral-100 to-neutral-200 p-4 text-center">
          <ShieldCheck size={size === "sm" ? 28 : 44} weight="duotone" className="text-neutral-400" />
          <div className={`font-display font-bold text-neutral-700 ${size === "sm" ? "text-xs" : "text-sm"}`}>
            {product?.name}
          </div>
          {activeVariant.label && (
            <div className="text-[11px] text-neutral-500">{activeVariant.label}</div>
          )}
        </div>
      )}

      {showRibbon && product?.badge && (
        <span className="absolute right-2 top-2 rounded-full bg-neutral-900 px-2 py-0.5 font-display text-[9px] font-bold uppercase tracking-[0.08em] text-[#FCE029]">
          {product.badge}
        </span>
      )}
    </div>
  );
}
