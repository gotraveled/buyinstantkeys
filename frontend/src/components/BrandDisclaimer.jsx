import { ShieldCheck } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

export default function BrandDisclaimer({ variant = "footer" }) {
  const wrapper =
    variant === "footer"
      ? "border-t border-neutral-200 bg-neutral-100 text-neutral-600"
      : "bg-neutral-50 border-b border-neutral-200 text-neutral-500";
  return (
    <div data-testid="brand-disclaimer" className={wrapper}>
      <div className="container-page py-3 text-[11px] leading-relaxed">
        <div className="flex items-start gap-2">
          <ShieldCheck size={14} weight="duotone" className="mt-0.5 shrink-0 text-neutral-500" />
          <p>
            <strong className="font-semibold text-neutral-700">Disclaimer:</strong> BuyInstantKeys is an independent digital software reseller. We are <strong>not affiliated with, endorsed by, sponsored by, or in any way officially connected to</strong> NortonLifeLock, Gen Digital Inc., Norton, or any of their subsidiaries or affiliates. Norton® is a registered trademark of Gen Digital Inc. All other product names, logos, brands, trademarks and registered trademarks are property of their respective owners. All company, product and service names used on this website are for identification purposes only. Use of these names, logos, and brands does not imply endorsement. Read our full <Link to="/disclaimer" className="underline hover:text-neutral-900">Disclaimer</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
