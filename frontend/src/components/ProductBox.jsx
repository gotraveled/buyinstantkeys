import { ShieldCheck, WindowsLogo, AppleLogo, AndroidLogo, CheckCircle } from "@phosphor-icons/react";

// Professional light theme palette matching website aesthetic
const PALETTE = {
  gold:   { primary: "#FFC220", secondary: "#0A0A0A", accent: "#F5F5F5", tag: "AntiVirus" },
  amber:  { primary: "#F59E0B", secondary: "#0A0A0A", accent: "#FFFBEB", tag: "Premium" },
  black:  { primary: "#0A0A0A", secondary: "#FCE029", accent: "#FAFAFA", tag: "LifeLock" },
  green:  { primary: "#059669", secondary: "#0A0A0A", accent: "#ECFDF5", tag: "Privacy" },
  purple: { primary: "#6D28D9", secondary: "#FFFFFF", accent: "#F5F3FF", tag: "Gaming" },
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
      className="relative flex h-full w-full flex-col overflow-hidden rounded-xl border shadow-sm transition-shadow hover:shadow-md"
      style={{
        borderColor: "#E5E7EB",
        background: "#FFFFFF",
      }}
    >
      {/* Top accent bar */}
      <div
        className="h-1"
        style={{
          background: cfg.primary,
        }}
      />

      {/* Content */}
      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
        {/* Header with brand and badge */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div
              className="grid h-8 w-8 place-items-center rounded-lg"
              style={{ background: cfg.accent }}
            >
              <ShieldCheck size={18} weight="fill" style={{ color: cfg.primary }} />
            </div>
            <div>
              <div
                className="font-display font-bold tracking-tight"
                style={{
                  fontSize: size === "lg" ? 18 : 14,
                  color: cfg.secondary,
                }}
              >
                NORTON
              </div>
              <div
                className="font-display font-semibold leading-tight"
                style={{
                  fontSize: size === "lg" ? 14 : 11,
                  color: cfg.primary,
                }}
              >
                {name}
              </div>
            </div>
          </div>
          {showRibbon && product?.badge && (
            <span
              className="rounded-full px-2 py-0.5 font-display text-[9px] font-bold uppercase tracking-[0.12em]"
              style={{
                background: cfg.primary,
                color: cfg.secondary,
              }}
            >
              {product.badge}
            </span>
          )}
        </div>

        {/* Category tag */}
        <div
          className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-medium uppercase tracking-[0.1em]"
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
              <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "#6B7280" }}>
                <CheckCircle size={14} weight="fill" style={{ color: cfg.primary, marginTop: 1, flexShrink: 0 }} />
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
              borderColor: "#E5E7EB",
              background: "#F9FAFB",
            }}
          >
            <div className="min-w-0">
              <div
                className="font-display text-[9px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: "#9CA3AF" }}
              >
                Plan
              </div>
              <div
                className="font-display text-xs font-semibold"
                style={{ color: cfg.secondary }}
              >
                {devices} · {years}
              </div>
            </div>
            <div className="flex items-center gap-1.5" style={{ color: "#9CA3AF" }}>
              <WindowsLogo size={12} weight="fill" />
              <AppleLogo size={12} weight="fill" />
              <AndroidLogo size={12} weight="fill" />
            </div>
          </div>
        )}

        {/* Small size: minimal tier */}
        {!showDetails && (
          <div
            className="mt-3 text-[9px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: "#9CA3AF" }}
          >
            {devices} · {years}
          </div>
        )}
      </div>
    </div>
  );
}
