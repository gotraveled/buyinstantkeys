import { ShieldCheck, WindowsLogo, AppleLogo, AndroidLogo, CheckCircle } from "@phosphor-icons/react";

// Flat, modern product tile — no 3D transforms, no perspective. Clean card look.
const PALETTE = {
  gold:   { primary: "#FFC220", ink: "#0A0A0A", body: "#0057BB", accent: "#8FB4FF", tag: "AntiVirus" },
  amber:  { primary: "#F59E0B", ink: "#FFFFFF", body: "#F59E0B", accent: "#7C2D12", tag: "Premium" },
  black:  { primary: "#0A0A0A", ink: "#FCE029", body: "#0A0A0A", accent: "#FCE029", tag: "LifeLock" },
  green:  { primary: "#059669", ink: "#FFFFFF", body: "#059669", accent: "#A7F3D0", tag: "Privacy" },
  purple: { primary: "#6D28D9", ink: "#FFFFFF", body: "#6D28D9", accent: "#DDD6FE", tag: "Gaming" },
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
  const bodyBg = isFullDark ? "#0A0A0A" : "#FFFFFF";
  const bodyInk = isFullDark ? "#FCE029" : "#0A0A0A";
  const bodyInkMuted = isFullDark ? "rgba(252,224,41,0.7)" : "#525252";

  return (
    <div
      data-testid={`product-box-${product?.slug}`}
      className="relative flex h-full w-full flex-col overflow-hidden rounded-xl border"
      style={{
        borderColor: isFullDark ? "#0A0A0A" : "#E5E7EB",
        background: bodyBg,
      }}
    >
      {/* Top colored band with brand */}
      <div
        className="relative flex items-center justify-between px-4 py-3"
        style={{ background: cfg.primary, color: cfg.ink }}
      >
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={size === "lg" ? 22 : 16} weight="fill" />
          <span className="font-display font-black tracking-tight" style={{ fontSize: size === "lg" ? 22 : 14 }}>
            norton
          </span>
        </div>
        {showRibbon && (
          <span
            className="rounded-sm px-2 py-0.5 font-display text-[9px] font-bold uppercase tracking-[0.16em]"
            style={{ background: cfg.ink, color: cfg.primary }}
          >
            {product?.badge || "Digital"}
          </span>
        )}
      </div>

      {/* Diagonal accent stripe */}
      <div
        className="pointer-events-none absolute -right-6 top-8 h-16 w-32 rotate-[-8deg] opacity-[0.06]"
        style={{ background: cfg.body }}
      />

      {/* Body */}
      <div className="flex flex-1 flex-col px-4 pb-4 pt-4" style={{ color: bodyInk }}>
        {/* Tag chip */}
        <div
          className="inline-flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
          style={{
            borderColor: cfg.primary,
            color: bodyInk,
            background: isFullDark ? "rgba(252,224,41,0.08)" : `${cfg.primary}22`,
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.primary }} />
          {product?.category || cfg.tag}
        </div>

        {/* Product name */}
        <div className="mt-3">
          <div className="font-display font-black leading-[1.05] tracking-tight" style={{ fontSize: size === "lg" ? 30 : size === "md" ? 20 : 14 }}>
            Norton
          </div>
          <div
            className="font-display font-extrabold leading-[1.05] tracking-tight"
            style={{
              fontSize: size === "lg" ? 26 : size === "md" ? 18 : 12,
              color: isFullDark ? cfg.primary : cfg.body,
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

        {/* Tier row */}
        {showDetails && (
          <div className="mt-4 flex items-center justify-between rounded-lg border px-3 py-2" style={{ borderColor: cfg.primary, background: isFullDark ? "rgba(252,224,41,0.06)" : `${cfg.primary}0F` }}>
            <div className="min-w-0">
              <div className="font-display text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: bodyInkMuted }}>
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
    </div>
  );
}
