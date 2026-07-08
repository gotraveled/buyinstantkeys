import { ShieldCheck, WindowsLogo, AppleLogo, AndroidLogo, CheckCircle } from "@phosphor-icons/react";

// 3D packaging palette matching Norton retail boxes
const PALETTE = {
  gold:   { 
    primary: "#FFC220", 
    secondary: "#0A0A0A", 
    body: "#0047AB", 
    bodyGradient: ["#0047AB", "#003366"],
    spine: "#002244",
    accent: "#FFD700",
    tag: "AntiVirus" 
  },
  amber:  { 
    primary: "#F59E0B", 
    secondary: "#0A0A0A", 
    body: "#1E3A5F", 
    bodyGradient: ["#1E3A5F", "#152A45"],
    spine: "#0D1F33",
    accent: "#FFB84D",
    tag: "Premium" 
  },
  black:  { 
    primary: "#0A0A0A", 
    secondary: "#FCE029", 
    body: "#1A1A1A", 
    bodyGradient: ["#1A1A1A", "#0D0D0D"],
    spine: "#000000",
    accent: "#FCE029",
    tag: "LifeLock" 
  },
  green:  { 
    primary: "#059669", 
    secondary: "#FFFFFF", 
    body: "#064E3B", 
    bodyGradient: ["#064E3B", "#022C22"],
    spine: "#011912",
    accent: "#34D399",
    tag: "Privacy" 
  },
  purple: { 
    primary: "#6D28D9", 
    secondary: "#FFFFFF", 
    body: "#4C1D95", 
    bodyGradient: ["#4C1D95", "#2E1065"],
    spine: "#1E0A4A",
    accent: "#A78BFA",
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

  const boxScale = size === "lg" ? 1 : size === "md" ? 0.9 : 0.75;

  return (
    <div
      data-testid={`product-box-${product?.slug}`}
      className="relative flex h-full w-full flex-col overflow-hidden"
      style={{
        transform: `scale(${boxScale})`,
        transformOrigin: "center center",
      }}
    >
      {/* 3D Box Container */}
      <div
        className="relative flex h-full w-full"
        style={{
          perspective: "1200px",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Main Box Face */}
        <div
          className="relative flex flex-1 flex-col overflow-hidden rounded-lg"
          style={{
            background: `linear-gradient(135deg, ${cfg.bodyGradient[0]} 0%, ${cfg.bodyGradient[1]} 100%)`,
            boxShadow: `
              0 20px 50px rgba(0,0,0,0.5),
              0 10px 20px rgba(0,0,0,0.3),
              inset 0 1px 0 rgba(255,255,255,0.1),
              inset 0 -1px 0 rgba(0,0,0,0.2)
            `,
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {/* Glossy overlay */}
          <div
            className="pointer-events-none absolute left-0 top-0 h-full w-1/2"
            style={{
              background: "linear-gradient(90deg, rgba(255,255,255,0.15) 0%, transparent 100%)",
            }}
          />

          {/* Top header band */}
          <div
            className="relative flex items-center justify-between px-4 py-3"
            style={{
              background: `linear-gradient(180deg, ${cfg.primary} 0%, ${cfg.accent} 100%)`,
              borderBottom: "2px solid rgba(0,0,0,0.3)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            }}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck size={size === "lg" ? 24 : 20} weight="fill" style={{ color: cfg.secondary }} />
              <span
                className="font-display font-black tracking-tight"
                style={{
                  fontSize: size === "lg" ? 22 : 18,
                  color: cfg.secondary,
                  textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                }}
              >
                NORTON
              </span>
            </div>
            {showRibbon && product?.badge && (
              <span
                className="rounded-sm px-2 py-0.5 font-display text-[9px] font-bold uppercase tracking-[0.14em]"
                style={{
                  background: cfg.secondary,
                  color: cfg.primary,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                }}
              >
                {product.badge}
              </span>
            )}
          </div>

          {/* Body content */}
          <div className="flex flex-1 flex-col px-4 pb-4 pt-4" style={{ color: cfg.secondary }}>
            {/* Category badge */}
            <div
              className="inline-flex w-fit items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]"
              style={{
                borderColor: cfg.primary,
                color: cfg.secondary,
                background: `${cfg.primary}33`,
                backdropFilter: "blur(4px)",
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.primary }} />
              {product?.category || cfg.tag}
            </div>

            {/* Product name */}
            <div className="mt-3">
              <div
                className="font-display font-black leading-[1.05] tracking-tight"
                style={{
                  fontSize: size === "lg" ? 28 : size === "md" ? 22 : 16,
                  color: cfg.secondary,
                  textShadow: "0 2px 8px rgba(0,0,0,0.5)",
                }}
              >
                NORTON
              </div>
              <div
                className="font-display font-extrabold leading-[1.05] tracking-tight"
                style={{
                  fontSize: size === "lg" ? 24 : size === "md" ? 18 : 12,
                  color: cfg.primary,
                  textShadow: "0 2px 8px rgba(0,0,0,0.5)",
                }}
              >
                {name}
              </div>
            </div>

            {/* Features */}
            {showDetails && features.length > 0 && (
              <ul className="mt-3 space-y-1.5 text-[11px]" style={{ color: "rgba(255,255,255,0.85)" }}>
                {features.map((f, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <CheckCircle size={12} weight="fill" style={{ color: cfg.primary, marginTop: 2 }} />
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
                className="mt-4 flex items-center justify-between rounded-lg border px-3 py-2"
                style={{
                  borderColor: cfg.primary,
                  background: `${cfg.primary}22`,
                  backdropFilter: "blur(4px)",
                }}
              >
                <div className="min-w-0">
                  <div
                    className="font-display text-[9px] font-semibold uppercase tracking-[0.12em]"
                    style={{ color: "rgba(255,255,255,0.7)" }}
                  >
                    Plan
                  </div>
                  <div className="font-display text-xs font-bold" style={{ color: cfg.secondary }}>
                    {devices} · {years}
                  </div>
                </div>
                <div className="flex items-center gap-2" style={{ color: "rgba(255,255,255,0.7)" }}>
                  <WindowsLogo size={14} weight="fill" />
                  <AppleLogo size={14} weight="fill" />
                  <AndroidLogo size={14} weight="fill" />
                </div>
              </div>
            )}

            {/* Small size: minimal tier */}
            {!showDetails && (
              <div className="mt-2 text-[9px] font-semibold uppercase tracking-[0.12em]" style={{ color: "rgba(255,255,255,0.7)" }}>
                {devices} · {years}
              </div>
            )}
          </div>

          {/* Bottom accent */}
          <div
            className="h-1.5"
            style={{
              background: `linear-gradient(90deg, ${cfg.primary} 0%, ${cfg.accent} 50%, ${cfg.primary} 100%)`,
            }}
          />
        </div>

        {/* Box Spine (3D effect) */}
        <div
          className="absolute left-0 top-0 h-full w-4"
          style={{
            background: `linear-gradient(90deg, ${cfg.spine} 0%, ${cfg.bodyGradient[1]} 100%)`,
            transform: "rotateY(-90deg) translateZ(-2px)",
            transformOrigin: "left",
            boxShadow: "inset -2px 0 6px rgba(0,0,0,0.4)",
          }}
        />
      </div>
    </div>
  );
}
