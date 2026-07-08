import { ShieldCheck, WindowsLogo, AppleLogo, AndroidLogo, CheckCircle } from "@phosphor-icons/react";

// Clean retail packaging palette
const PALETTE = {
  gold:   { 
    primary: "#FFD700", 
    secondary: "#FFFFFF", 
    body: "#0052CC",
    accent: "#E6F0FF",
    tag: "AntiVirus" 
  },
  amber:  { 
    primary: "#FF9500", 
    secondary: "#FFFFFF", 
    body: "#FF6B00",
    accent: "#FFF0E6",
    tag: "Premium" 
  },
  black:  { 
    primary: "#000000", 
    secondary: "#FFFFFF", 
    body: "#1A1A1A",
    accent: "#F5F5F5",
    tag: "LifeLock" 
  },
  green:  { 
    primary: "#00C853", 
    secondary: "#FFFFFF", 
    body: "#006400",
    accent: "#E8F5E9",
    tag: "Privacy" 
  },
  purple: { 
    primary: "#7C4DFF", 
    secondary: "#FFFFFF", 
    body: "#4A148C",
    accent: "#F3E5F5",
    tag: "Gaming" 
  },
};

function shortName(name) {
  return name.replace(/^Norton\s+/i, "");
}

function parseTierLabel(label) {
  if (!label) return { years: "1 Year", devices: "1 Device" };
  const parts = label.split("/").map((s) => s.trim());
  return { devices: parts[0] || "1 Device", years: parts[1] || "1 Year" };
}

export default function ProductBox({ product, variant, size = "md", showRibbon = true }) {
  const cfg = PALETTE[product?.box_variant] || PALETTE.gold;
  const activeVariant = variant || product?.variants?.[0] || {};
  const { years, devices } = parseTierLabel(activeVariant.label);
  const name = shortName(product?.name || "Norton");
  const features = (product?.features || []).slice(0, 2);
  const showDetails = size !== "sm";

  return (
    <div
      data-testid={`product-box-${product?.slug}`}
      className="relative flex h-full w-full flex-col overflow-hidden rounded-xl border transition-all hover:scale-[1.02] hover:shadow-lg"
      style={{
        borderColor: "#E5E7EB",
        background: "#FFFFFF",
      }}
    >
      {/* Color header */}
      <div
        className="px-5 py-4"
        style={{ background: cfg.body }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="grid h-10 w-10 place-items-center rounded-full"
              style={{ background: cfg.primary }}
            >
              <ShieldCheck size={20} weight="fill" style={{ color: cfg.secondary }} />
            </div>
            <div>
              <div
                className="font-display font-bold tracking-tight"
                style={{
                  fontSize: size === "lg" ? 20 : 16,
                  color: cfg.secondary,
                }}
              >
                NORTON
              </div>
              <div
                className="font-display font-semibold leading-tight"
                style={{
                  fontSize: size === "lg" ? 16 : 12,
                  color: cfg.primary,
                }}
              >
                {name}
              </div>
            </div>
          </div>
          {showRibbon && product?.badge && (
            <span
              className="rounded-full px-3 py-1 font-display text-[10px] font-bold uppercase tracking-[0.1em]"
              style={{
                background: cfg.primary,
                color: cfg.secondary,
              }}
            >
              {product.badge}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
        {/* Category tag */}
        <div
          className="inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
          style={{
            color: "#6B7280",
            background: "#F3F4F6",
          }}
        >
          {product?.category || cfg.tag}
        </div>

        {/* Features */}
        {showDetails && features.length > 0 && (
          <ul className="mt-4 space-y-2">
            {features.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "#4B5563" }}>
                <CheckCircle size={16} weight="fill" style={{ color: cfg.primary, marginTop: 1, flexShrink: 0 }} />
                <span className="line-clamp-1">{f}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Tier information */}
        {showDetails && (
          <div
            className="mt-4 flex items-center justify-between rounded-lg px-3 py-2"
            style={{
              background: cfg.accent,
            }}
          >
            <div className="min-w-0">
              <div
                className="font-display text-[10px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: "#6B7280" }}
              >
                Plan
              </div>
              <div
                className="font-display text-sm font-semibold"
                style={{ color: "#1F2937" }}
              >
                {devices} · {years}
              </div>
            </div>
            <div className="flex items-center gap-2" style={{ color: "#9CA3AF" }}>
              <WindowsLogo size={16} weight="fill" />
              <AppleLogo size={16} weight="fill" />
              <AndroidLogo size={16} weight="fill" />
            </div>
          </div>
        )}

        {/* Small size: minimal tier */}
        {!showDetails && (
          <div
            className="mt-3 text-[10px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: "#9CA3AF" }}
          >
            {devices} · {years}
          </div>
        )}
      </div>
    </div>
  );
}
