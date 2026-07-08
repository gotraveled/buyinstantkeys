import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Lightning, Tag, X } from "@phosphor-icons/react";

function useCountdown(expiresAt) {
  const [remaining, setRemaining] = useState(computeRemaining(expiresAt));
  useEffect(() => {
    const t = setInterval(() => setRemaining(computeRemaining(expiresAt)), 1000);
    return () => clearInterval(t);
  }, [expiresAt]);
  return remaining;
}

function computeRemaining(expiresAt) {
  if (!expiresAt) return null;
  const end = new Date(expiresAt).getTime();
  const diff = Math.max(0, end - Date.now());
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s, expired: diff === 0 };
}

export default function OfferBanner() {
  const [banner, setBanner] = useState(null);
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem("bik_banner_dismissed") === "1");

  useEffect(() => {
    api.get("/banner").then((r) => setBanner(r.data)).catch(() => {});
  }, []);

  const remaining = useCountdown(banner?.expires_at);

  if (!banner || dismissed || remaining?.expired) return null;

  const digit = (n) => String(n).padStart(2, "0");

  return (
    <div data-testid="offer-banner" className="relative bg-neutral-900 text-white">
      <div className="container-page flex flex-wrap items-center justify-center gap-4 py-3 text-sm md:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-[#FCE029] text-neutral-900">
            <Lightning size={16} weight="fill" />
          </div>
          <div className="min-w-0">
            <span className="mr-2 rounded bg-[#FCE029] px-2 py-0.5 font-display text-xs font-bold uppercase tracking-[0.18em] text-neutral-900">{banner.title}</span>
            <span className="text-neutral-100">{banner.message}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {banner.coupon_code && (
            <Link to="/products" className="hidden items-center gap-1.5 rounded-md border border-[#FCE029] px-3 py-1 text-xs font-semibold text-[#FCE029] hover:bg-[#FCE029] hover:text-neutral-900 md:inline-flex">
              <Tag size={12} weight="fill" /> Code: <span className="font-mono">{banner.coupon_code}</span>
            </Link>
          )}
          {remaining && !remaining.expired && (
            <div data-testid="offer-countdown" className="flex items-center gap-1.5 font-mono text-xs">
              <span className="rounded bg-white/10 px-1.5 py-0.5">{digit(remaining.d)}d</span>
              <span className="rounded bg-white/10 px-1.5 py-0.5">{digit(remaining.h)}h</span>
              <span className="rounded bg-white/10 px-1.5 py-0.5">{digit(remaining.m)}m</span>
              <span className="rounded bg-[#FCE029] px-1.5 py-0.5 text-neutral-900">{digit(remaining.s)}s</span>
            </div>
          )}
          <button
            data-testid="offer-banner-close"
            onClick={() => { setDismissed(true); sessionStorage.setItem("bik_banner_dismissed", "1"); }}
            className="rounded p-1 text-neutral-400 hover:bg-white/10 hover:text-white"
            aria-label="Dismiss banner"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
