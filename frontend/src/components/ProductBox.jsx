import { ShieldCheck, WindowsLogo, AppleLogo, AndroidLogo, CheckCircle } from "@phosphor-icons/react";

// Product box palette with realistic software box colors
const PALETTE = {
  gold:   { primary: "#FFC220", ink: "#0A0A0A", body: "#003366", accent: "#0057BB", tag: "AntiVirus", spine: "#002244" },
  amber:  { primary: "#F59E0B", ink: "#FFFFFF", body: "#1E3A5F", accent: "#F59E0B", tag: "Premium", spine: "#152A45" },
  black:  { primary: "#0A0A0A", ink: "#FCE029", body: "#1A1A1A", accent: "#FCE029", tag: "LifeLock", spine: "#0D0D0D" },
  green:  { primary: "#059669", ink: "#FFFFFF", body: "#064E3B", accent: "#059669", tag: "Privacy", spine: "#022C22" },
  purple: { primary: "#6D28D9", ink: "#FFFFFF", body: "#4C1D95", accent: "#6D28D9", tag: "Gaming", spine: "#2E1065" },
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

  const isFullDark = product?.box_variant === "black";
  const bodyBg = cfg.body;
  const bodyInk = isFullDark ? "#FCE029" : "#FFFFFF";
  const bodyInkMuted = isFullDark ? "rgba(252,224,41,0.7)" : "rgba(255,255,255,0.8)";

  const boxScale = size === "lg" ? 1 : size === "md" ? 0.85 : 0.7;

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
          perspective: "1000px",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Main Box Face */}
        <div
          className="relative flex flex-1 flex-col overflow-hidden rounded-lg shadow-2xl"
          style={{
            background: `linear-gradient(135deg, ${cfg.body} 0%, ${cfg.spine} 100%)`,
            border: "2px solid rgba(255,255,255,0.1)",
            boxShadow: `
              0 10px 40px rgba(0,0,0,0.4),
              0 0 0 1px rgba(255,255,255,0.05),
              inset 0 1px 0 rgba(255,255,255,0.1)
            `,
          }}
        >
          {/* Top Header Band */}
          <div
            className="relative flex items-center justify-between px-4 py-3"
            style={{
              background: `linear-gradient(180deg, ${cfg.primary} 0%, ${cfg.accent} 100%)`,
              borderBottom: "2px solid rgba(0,0,0,0.2)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}
          >
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={size === "lg" ? 24 : 18} weight="fill" style={{ color: cfg.ink }} />
              <span
                className="font-display font-black tracking-tight"
                style={{
                  fontSize: size === "lg" ? 24 : 16,
                  color: cfg.ink,
                  textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                }}
              >
                NORTON
              </span>
            </div>
            {showRibbon && (
              <span
                className="rounded-sm px-2 py-0.5 font-display text-[9px] font-bold uppercase tracking-[0.16em]"
                style={{
                  background: cfg.ink,
                  color: cfg.primary,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                }}
              >
                {product?.badge || "Digital"}
              </span>
            )}
          </div>

          {/* Glossy Overlay */}
          <div
            className="pointer-events-none absolute left-0 top-0 h-full w-1/2"
            style={{
              background: "linear-gradient(90deg, rgba(255,255,255,0.1) 0%, transparent 100%)",
            }}
          />

          {/* Body Content */}
          <div className="flex flex-1 flex-col px-4 pb-4 pt-4" style={{ color: bodyInk }}>
            {/* Category Tag */}
            <div
              className="inline-flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{
                borderColor: cfg.primary,
                color: bodyInk,
                background: `${cfg.primary}33`,
                backdropFilter: "blur(4px)",
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.primary }} />
              {product?.category || cfg.tag}
            </div>

            {/* Product Name */}
            <div className="mt-3">
              <div
                className="font-display font-black leading-[1.05] tracking-tight"
                style={{
                  fontSize: size === "lg" ? 32 : size === "md" ? 22 : 16,
                  color: bodyInk,
                  textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                }}
              >
                NORTON
              </div>
              <div
                className="font-display font-extrabold leading-[1.05] tracking-tight"
                style={{
                  fontSize: size === "lg" ? 28 : size === "md" ? 20 : 14,
                  color: cfg.primary,
                  textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                }}
              >
                {name}
              </div>
            </div>

            {/* Features */}
            {showDetails && features.length > 0 && (
              <ul className="mt-3 space-y-1.5 text-[11px]" style={{ color: bodyInkMuted }}>
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

            {/* Tier Information */}
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
                    className="font-display text-[10px] font-semibold uppercase tracking-[0.15em]"
                    style={{ color: bodyInkMuted }}
                  >
                    Plan
                  </div>
                  <div className="font-display text-xs font-bold" style={{ color: bodyInk }}>
                    {devices} · {years}
                  </div>
                </div>
                <div className="flex items-center gap-2" style={{ color: bodyInkMuted }}>
                  <WindowsLogo size={14} weight="fill" />
                  <AppleLogo size={14} weight="fill" />
                  <AndroidLogo size={14} weight="fill" />
                </div>
              </div>
            )}

            {/* Small size: minimal tier */}
            {!showDetails && (
              <div className="mt-2 text-[9px] font-semibold uppercase tracking-[0.15em]" style={{ color: bodyInkMuted }}>
                {devices} · {years}
              </div>
            )}
          </div>

          {/* Bottom Accent */}
          <div
            className="h-1"
            style={{
              background: `linear-gradient(90deg, ${cfg.primary} 0%, ${cfg.accent} 50%, ${cfg.primary} 100%)`,
            }}
          />
        </div>

        {/* Box Spine (3D effect) */}
        <div
          className="absolute left-0 top-0 h-full w-3"
          style={{
            background: `linear-gradient(90deg, ${cfg.spine} 0%, ${cfg.body} 100%)`,
            transform: "rotateY(-90deg) translateZ(-1.5px)",
            transformOrigin: "left",
            boxShadow: "inset -2px 0 4px rgba(0,0,0,0.3)",
          }}
        />
      </div>
    </div>
  );
}
