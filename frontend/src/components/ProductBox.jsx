import { ShieldCheck } from "@phosphor-icons/react";

const VARIANTS = {
  gold:   { bg: "#FCE029", fg: "#0A0A0A", accent: "#0A0A0A", ribbon: "#0A0A0A", ribbonFg: "#FCE029", grid: "rgba(0,0,0,0.06)" },
  amber:  { bg: "#F59E0B", fg: "#0A0A0A", accent: "#0A0A0A", ribbon: "#0A0A0A", ribbonFg: "#F59E0B", grid: "rgba(0,0,0,0.08)" },
  black:  { bg: "#0A0A0A", fg: "#FCE029", accent: "#FCE029", ribbon: "#FCE029", ribbonFg: "#0A0A0A", grid: "rgba(252,224,41,0.08)" },
  green:  { bg: "#059669", fg: "#FFFFFF", accent: "#FCE029", ribbon: "#0A0A0A", ribbonFg: "#FCE029", grid: "rgba(255,255,255,0.08)" },
  purple: { bg: "#6D28D9", fg: "#FFFFFF", accent: "#FCE029", ribbon: "#FCE029", ribbonFg: "#0A0A0A", grid: "rgba(255,255,255,0.08)" },
};

function splitTitle(name) {
  // Strip "Norton" prefix for display in the big line, keep the rest wrapped
  const clean = name.replace(/^Norton\s+/i, "");
  return { brand: "NORTON", title: clean };
}

// A Norton-styled product box — always renders reliably, no external images
export default function ProductBox({ product, size = "md", showRibbon = true }) {
  const v = VARIANTS[product.box_variant] || VARIANTS.gold;
  const { brand, title } = splitTitle(product.name);

  const heights = { sm: "h-32", md: "h-44", lg: "h-64" };
  const titleSizes = { sm: "text-sm", md: "text-lg", lg: "text-2xl" };
  const brandSizes = { sm: "text-[10px]", md: "text-xs", lg: "text-sm" };

  const badgeText = product.badge || product.category;

  return (
    <div
      data-testid={`product-box-${product.slug}`}
      className={`relative w-full overflow-hidden rounded-lg ${heights[size]}`}
      style={{
        background: v.bg,
        color: v.fg,
        backgroundImage: `
          linear-gradient(135deg, ${v.grid} 25%, transparent 25%),
          linear-gradient(225deg, ${v.grid} 25%, transparent 25%),
          linear-gradient(45deg, ${v.grid} 25%, transparent 25%),
          linear-gradient(315deg, ${v.grid} 25%, transparent 25%)`,
        backgroundPosition: "20px 0, 20px 0, 0 0, 0 0",
        backgroundSize: "40px 40px",
      }}
    >
      {/* subtle inner border */}
      <div className="pointer-events-none absolute inset-1 rounded-md border" style={{ borderColor: v.accent, opacity: 0.28 }} />

      {/* top ribbon */}
      {showRibbon && (
        <div
          className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-sm px-2 py-1 text-[10px] font-bold uppercase tracking-[0.15em]"
          style={{ background: v.ribbon, color: v.ribbonFg }}
        >
          <ShieldCheck size={10} weight="fill" /> {badgeText}
        </div>
      )}

      {/* Norton logo/brand */}
      <div className={`absolute right-3 top-3 flex items-center gap-1 font-display font-black tracking-tight ${brandSizes[size]}`}>
        <ShieldCheck size={size === "lg" ? 20 : 14} weight="duotone" />
        <span>{brand}</span>
      </div>

      {/* Product title */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className={`font-display font-black leading-[1.05] tracking-tight ${titleSizes[size]}`}>{title}</div>
        <div className={`mt-1 font-mono ${brandSizes[size]} opacity-70`}>{product.variants?.[0]?.label || ""}</div>
      </div>

      {/* diagonal accent */}
      <div
        className="absolute -right-8 top-1/2 h-24 w-24 -translate-y-1/2 rotate-45"
        style={{ background: v.accent, opacity: 0.12 }}
      />
    </div>
  );
}
