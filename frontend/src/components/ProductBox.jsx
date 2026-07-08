import { WindowsLogo, AppleLogo, AndroidLogo, Globe } from "@phosphor-icons/react";

// Color palette per box_variant (top band + body + accent)
const PALETTE = {
  gold:   { top: "#FFC220", body: "#0057BB", bodyDeep: "#003E86", accent: "#8FB4FF", tierBg: "#0A0A0A", spineText: "#FFFFFF" },
  amber:  { top: "#F59E0B", body: "#0057BB", bodyDeep: "#003E86", accent: "#FFD84F", tierBg: "#0A0A0A", spineText: "#FFFFFF" },
  black:  { top: "#FCE029", body: "#0A0A0A", bodyDeep: "#000000", accent: "#FCE029", tierBg: "#B45309", spineText: "#FCE029" },
  green:  { top: "#FCE029", body: "#065F46", bodyDeep: "#022C22", accent: "#6EE7B7", tierBg: "#0A0A0A", spineText: "#FFFFFF" },
  purple: { top: "#FCE029", body: "#4C1D95", bodyDeep: "#2E1065", accent: "#DDD6FE", tierBg: "#0A0A0A", spineText: "#FFFFFF" },
};

function splitProductName(name) {
  // "Norton 360 Deluxe" -> line1="Norton 360", line2="Deluxe"
  // "Norton 360 with LifeLock Select" -> line1="Norton 360", line2="with LifeLock Select"
  // "Norton AntiVirus Plus" -> line1="Norton AntiVirus", line2="Plus"
  const stripped = name.replace(/^Norton\s+/i, "").trim();
  const words = stripped.split(/\s+/);
  if (words[0] === "360") {
    return { line1: "Norton 360", line2: words.slice(1).join(" ") };
  }
  // fallback: first two words in line1, rest in line2
  return { line1: `Norton ${words[0]}`, line2: words.slice(1).join(" ") || "" };
}

function parseTierLabel(label) {
  // "5 Devices / 2 Years" -> years="2 Year", devices="5 Devices"
  // "Unlimited Devices / 1 Year" -> years="1 Year", devices="Unlimited"
  if (!label) return { years: "1 Year", devices: "1 Device" };
  const m = label.split("/").map(s => s.trim());
  const devices = m[0] || "1 Device";
  const years = m[1] || "1 Year";
  return { years, devices };
}

/**
 * Realistic 3D Norton-styled product box.
 * Renders as inline SVG for perfect scaling; content is fully dynamic per product.
 */
export default function ProductBox({ product, variant, size = "md", showRibbon = true }) {
  const cfg = PALETTE[product?.box_variant] || PALETTE.gold;
  const { line1, line2 } = splitProductName(product?.name || "Norton");
  const activeVariant = variant || product?.variants?.[0] || {};
  const { years, devices } = parseTierLabel(activeVariant.label);
  const features = (product?.features || []).slice(0, 3);
  const showDetails = size !== "sm";

  return (
    <div data-testid={`product-box-${product?.slug}`} className="relative w-full h-full flex items-center justify-center" style={{ minHeight: 0 }}>
      <svg viewBox="0 0 340 460" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" style={{ maxHeight: "100%", filter: "drop-shadow(0 30px 30px rgba(0,0,0,0.25))" }}>
        <defs>
          {/* Body gradient for subtle 3D lighting */}
          <linearGradient id={`bg-${product?.slug || "def"}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={cfg.body} />
            <stop offset="70%" stopColor={cfg.body} />
            <stop offset="100%" stopColor={cfg.bodyDeep} />
          </linearGradient>
          <linearGradient id={`top-${product?.slug || "def"}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={cfg.top} />
            <stop offset="100%" stopColor={cfg.top} stopOpacity="0.88" />
          </linearGradient>
          <linearGradient id={`spine-${product?.slug || "def"}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={cfg.top} />
            <stop offset="100%" stopColor={cfg.top} stopOpacity="0.65" />
          </linearGradient>
          <clipPath id={`clip-${product?.slug || "def"}`}>
            <path d="M60 6 L340 0 L340 452 L60 458 Z" />
          </clipPath>
        </defs>

        {/* Ground shadow */}
        <ellipse cx="200" cy="452" rx="140" ry="6" fill="#000" opacity="0.18" />

        {/* Left spine (angled trapezoid) */}
        <polygon points="0,26 60,6 60,458 0,438" fill={`url(#spine-${product?.slug || "def"})`} />
        <line x1="60" y1="6" x2="60" y2="458" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />

        {/* Spine content - vertical text (Norton logo + product name) */}
        <g transform="rotate(-90 30 232)">
          <text x="30" y="232" textAnchor="middle" fill={cfg.spineText} fontFamily="Outfit, sans-serif" fontWeight="900" fontSize="14" letterSpacing="-0.02em">Norton {line2 || line1.replace("Norton ", "")}</text>
        </g>
        <g transform="translate(30, 30)">
          <circle cx="0" cy="0" r="9" fill="#fff" opacity="0.9" />
          <text x="0" y="4" textAnchor="middle" fill={cfg.body} fontSize="11" fontFamily="Outfit,sans-serif" fontWeight="900">✓</text>
        </g>

        {/* Main body face */}
        <g clipPath={`url(#clip-${product?.slug || "def"})`}>
          <rect x="60" y="0" width="280" height="460" fill={`url(#bg-${product?.slug || "def"})`} />

          {/* Yellow top band with curved bottom edge */}
          <path d={`M60 6 L340 0 L340 130 Q200 178 60 138 Z`} fill={`url(#top-${product?.slug || "def"})`} />

          {/* Norton branding on top band */}
          <g transform="translate(78, 42)">
            <circle cx="0" cy="0" r="13" fill="#FFFFFF" />
            <text x="0" y="5" textAnchor="middle" fill={cfg.body} fontFamily="Outfit, sans-serif" fontWeight="900" fontSize="17">✓</text>
            <text x="22" y="6" fill="#FFFFFF" fontFamily="Outfit, sans-serif" fontWeight="900" fontSize="24" letterSpacing="-0.03em">norton</text>
            <text x="22" y="6" fill="#FFFFFF" fontFamily="Outfit, sans-serif" fontWeight="900" fontSize="24" letterSpacing="-0.03em" opacity="0"></text>
            <text x="120" y="0" fill="#FFFFFF" fontFamily="Outfit, sans-serif" fontWeight="700" fontSize="8">®</text>
          </g>

          {/* DIGITAL DELIVERY badge */}
          {showRibbon && (
            <g transform="translate(258, 18)">
              <rect x="0" y="0" width="70" height="28" fill={cfg.body} stroke={cfg.top} strokeWidth="1.5" rx="2" />
              <text x="35" y="12" textAnchor="middle" fill="#FFFFFF" fontFamily="Outfit,sans-serif" fontWeight="800" fontSize="7" letterSpacing="0.05em">DIGITAL</text>
              <text x="35" y="22" textAnchor="middle" fill={cfg.top} fontFamily="Outfit,sans-serif" fontWeight="800" fontSize="7" letterSpacing="0.05em">DELIVERY ⬇</text>
            </g>
          )}

          {/* Concentric decorative circles */}
          <g opacity="0.32" stroke="#FFFFFF" strokeWidth="1.4" fill="none">
            <circle cx="200" cy="245" r="118" />
            <circle cx="200" cy="245" r="82" />
            <circle cx="200" cy="245" r="45" />
            {/* small dots on circle */}
            <circle cx="82" cy="245" r="4" fill="#FFFFFF" opacity="0.8" />
            <circle cx="318" cy="245" r="4" fill="#FFFFFF" opacity="0.8" />
            <circle cx="200" cy="127" r="4" fill="#FFFFFF" opacity="0.8" />
            <circle cx="200" cy="363" r="4" fill="#FFFFFF" opacity="0.8" />
          </g>
          {/* Center checkmark on the circle graphic */}
          <g transform="translate(200, 195)" opacity="0.95">
            <circle r="15" fill="none" stroke="#FFFFFF" strokeWidth="2" />
            <path d="M-6 0 L-1 6 L7 -6" stroke="#FFFFFF" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </g>

          {/* Product name (large) */}
          <g transform="translate(80, 235)">
            <text x="0" y="0" fill="#FFFFFF" fontFamily="Outfit, sans-serif" fontWeight="900" fontSize="26" letterSpacing="-0.02em">{line1}</text>
            <text x="0" y="24" fill={cfg.accent} fontFamily="Outfit, sans-serif" fontWeight="700" fontSize="18" letterSpacing="-0.02em">{line2}</text>
          </g>

          {/* Feature bullets */}
          {showDetails && (
            <g transform="translate(80, 285)" fill="#FFFFFF" fontFamily="IBM Plex Sans, sans-serif" fontSize="10">
              {features.map((f, i) => {
                const short = f.length > 34 ? f.slice(0, 32) + "…" : f;
                return (
                  <g key={i} transform={`translate(0, ${i * 15})`}>
                    <circle cx="4" cy="-3" r="2" fill={cfg.accent} />
                    <text x="12" y="0">{short}</text>
                  </g>
                );
              })}
            </g>
          )}

          {/* Tier badge */}
          <g transform="translate(70, 358)">
            <rect x="0" y="0" width="200" height="34" fill={cfg.tierBg} rx="2" />
            <text x="100" y="22" textAnchor="middle" fill="#FFFFFF" fontFamily="Outfit,sans-serif" fontWeight="800" fontSize="13" letterSpacing="0.02em">
              {years} | {devices}
            </text>
            <rect x="0" y="34" width="200" height="14" fill={cfg.top} rx="2" />
            <text x="100" y="45" textAnchor="middle" fill="#0A0A0A" fontFamily="Outfit,sans-serif" fontWeight="800" fontSize="9" letterSpacing="0.2em">GLOBAL VERSION</text>
          </g>

          {/* OS icons row */}
          {showDetails && (
            <g transform="translate(80, 415)" fill="#FFFFFF" fontFamily="Outfit,sans-serif">
              <g transform="translate(0, 0)">
                {/* Windows */}
                <path d="M0 -8 L14 -10 L14 0 L0 0 Z M16 -10 L34 -12 L34 0 L16 0 Z M0 2 L14 2 L14 12 L0 10 Z M16 2 L34 2 L34 14 L16 12 Z" fill="#FFFFFF" transform="scale(0.6)" />
                <text x="0" y="20" fontSize="7" fontWeight="600">Windows</text>
              </g>
              <g transform="translate(90, 0)">
                {/* Apple */}
                <path d="M6 -12 C4 -10 3 -8 5 -6 M2 -6 C0 -4 -1 0 1 3 C3 6 5 6 7 5 C9 4 11 4 13 5 C15 6 17 6 19 3 C21 0 20 -4 18 -6 C16 -8 12 -8 10 -6 C8 -8 4 -8 2 -6 Z" fill="#FFFFFF" transform="scale(0.7)" />
                <text x="6" y="20" fontSize="7" fontWeight="600">macOS</text>
              </g>
              <g transform="translate(175, 0)">
                {/* Android tag - simple robot silhouette using ellipse + circles */}
                <ellipse cx="10" cy="0" rx="10" ry="8" fill="#FFFFFF" />
                <circle cx="5" cy="-2" r="1.4" fill={cfg.body} />
                <circle cx="15" cy="-2" r="1.4" fill={cfg.body} />
                <line x1="4" y1="-9" x2="6" y2="-6" stroke="#FFFFFF" strokeWidth="1.4" />
                <line x1="16" y1="-9" x2="14" y2="-6" stroke="#FFFFFF" strokeWidth="1.4" />
                <text x="10" y="20" fontSize="7" fontWeight="600" textAnchor="middle">Android</text>
              </g>
            </g>
          )}

          {/* Globe icon at bottom-left */}
          <g transform="translate(66, 428)" opacity="0.8">
            <circle cx="0" cy="0" r="7" fill="none" stroke={cfg.top} strokeWidth="1.2" />
            <path d="M-7 0 L7 0 M0 -7 L0 7 M-5 -4 Q0 -6 5 -4 M-5 4 Q0 6 5 4" fill="none" stroke={cfg.top} strokeWidth="1" />
          </g>
        </g>

        {/* Subtle top highlight */}
        <path d="M60 6 L340 0 L340 4 L60 10 Z" fill="#FFFFFF" opacity="0.35" />
      </svg>
    </div>
  );
}
