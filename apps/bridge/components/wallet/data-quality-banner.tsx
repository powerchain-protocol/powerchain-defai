"use client";

type DataQuality = "fresh" | "stale" | "degraded" | "offline" | "unavailable";

export function DataQualityBanner({ quality, message, onRefresh, refreshing = false }: { quality: DataQuality; message?: string; onRefresh?: () => void; refreshing?: boolean }) {
  if (quality === "fresh") return null;
  const critical = quality === "offline" || quality === "unavailable";
  const label = quality === "stale" ? "Wallet data is stale" : quality === "degraded" ? "Partial chain data" : quality === "offline" ? "You are offline" : "Wallet data unavailable";
  return (
    <div role={critical ? "alert" : "status"} className={`rounded-xl border p-3 text-sm ${critical ? "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-100" : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-100"}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div><strong>{label}.</strong> {message || defaultMessage(quality)}</div>
        {onRefresh && quality !== "offline" ? <button type="button" disabled={refreshing} onClick={onRefresh} className="min-h-10 shrink-0 rounded-lg border border-current/20 px-3 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-60">{refreshing ? "Refreshing…" : "Refresh"}</button> : null}
      </div>
    </div>
  );
}

function defaultMessage(quality: DataQuality) {
  if (quality === "stale") return "Refresh before opening a new bridge or claim signature.";
  if (quality === "degraded") return "Available chain data is shown, but one provider is degraded.";
  if (quality === "offline") return "Existing transfer state is preserved. Do not resubmit while disconnected.";
  return "New bridge and claim actions are blocked until fresh data is available.";
}
