import { WarningCircle, ArrowClockwise } from "@phosphor-icons/react";

// Shown when an API fetch fails — replaces silent empty states so
// connectivity/backend problems are visible instead of a blank grid.
export default function LoadError({ label = "products", onRetry }) {
  return (
    <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center">
      <WarningCircle size={32} weight="duotone" className="mx-auto text-neutral-400" />
      <p className="mt-3 font-display font-semibold text-neutral-800">
        We couldn't load {label} right now.
      </p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-neutral-500">
        This is usually a temporary connection issue. Please try again in a moment.
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="btn-outline mt-5 inline-flex items-center gap-2"
        >
          <ArrowClockwise size={16} weight="bold" /> Retry
        </button>
      )}
    </div>
  );
}
