import { ShieldCheck, WindowsLogo, AppleLogo, AndroidLogo, CheckCircle } from "@phosphor-icons/react";

// Light 3D packaging palette with better text visibility
const PALETTE = {
  gold:   { 
    primary: "#FFD700", 
    secondary: "#FFFFFF", 
    body: "#E6F0FF",
    bodyGradient: ["#E6F0FF", "#BAE0FF"],
    accent: "#FFD700",
    tag: "AntiVirus" 
  },
  amber:  { 
    primary: "#FF9500", 
    secondary: "#FFFFFF", 
    body: "#FFF0E6",
    bodyGradient: ["#FFF0E6", "#FFE0CC"],
    accent: "#FF9500",
    tag: "Premium" 
  },
  black:  { 
    primary: "#333333", 
    secondary: "#FFFFFF", 
    body: "#F5F5F5",
    bodyGradient: ["#F5F5F5", "#E5E5E5"],
    accent: "#333333",
    tag: "LifeLock" 
  },
  green:  { 
    primary: "#00C853", 
    secondary: "#FFFFFF", 
    body: "#E8F5E9",
    bodyGradient: ["#E8F5E9", "#C8E6C9"],
    accent: "#00C853",
    tag: "Privacy" 
  },
  purple: { 
    primary: "#7C4DFF", 
    secondary: "#FFFFFF", 
    body: "#F3E5F5",
    bodyGradient: ["#F3E5F5", "#E1BEE7"],
    accent: "#7C4DFF",
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
      className="relative flex h-full w-full flex-col overflow-hidden"
      style={{
        perspective: "1000px",
      }}
    >
      {/* 3D Box Container */}
      <div
        className="relative flex h-full w-full transition-transform hover:scale-[1.03]"
        style={{
          transformStyle: "preserve-3d",
        }}
      >
        {/* Main Box Face */}
        <div
          className="relative flex flex-1 flex-col overflow-hidden rounded-xl"
          style={{
            background: `linear-gradient(135deg, ${cfg.bodyGradient[0]} 0%, ${cfg.bodyGradient[1]} 100%)`,
            boxShadow: `
              0 15px 35px rgba(0,0,0,0.15),
              0 5px 15px rgba(0,0,0,0.1),
              inset 0 1px 0 rgba(255,255,255,0.8),
              inset 0 -1px 0 rgba(0,0,0,0.05)
            `,
            border: "1px solid rgba(0,0,0,0.08)",
          }}
        >
          {/* Glossy overlay */}
          <div
            className="pointer-events-none absolute left-0 top-0 h-full w-1/2"
            style={{
              background: "linear-gradient(90deg, rgba(255,255,255,0.4) 0%, transparent 100%)",
            }}
          />

          {/* Color header */}
          <div
            className="px-5 py-4"
            style={{ 
              background: `linear-gradient(180deg, ${cfg.primary} 0%, ${cfg.accent} 100%)`,
              borderBottom: "1px solid rgba(0,0,0,0.1)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="grid h-10 w-10 place-items-center rounded-full"
                  style={{ background: "rgba(255,255,255,0.9)" }}
                >
                  <ShieldCheck size={20} weight="fill" style={{ color: cfg.primary }} />
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
                      color: cfg.secondary,
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
                    background: "rgba(255,255,255,0.9)",
                    color: cfg.primary,
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
                background: "rgba(255,255,255,0.7)",
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
                  background: "rgba(255,255,255,0.6)",
                  border: "1px solid rgba(0,0,0,0.08)",
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

        {/* Box Spine (3D effect) */}
        <div
          className="absolute left-0 top-0 h-full w-3"
          style={{
            background: `linear-gradient(90deg, rgba(0,0,0,0.1) 0%, ${cfg.bodyGradient[1]} 100%)`,
            transform: "rotateY(-90deg) translateZ(-1.5px)",
            transformOrigin: "left",
          }}
        />
      </div>
    </div>
  );
}
