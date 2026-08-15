"use client";

import { useProviderHealth } from "@/hooks/use-provider-health";

export function ProviderStatusStrip() {
  const { data, error, loading, stale, refresh } = useProviderHealth();
  if (loading && !data) return <div className="h-9 animate-pulse rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900" aria-label="Checking network providers" />;

  const unavailable = data?.status === "unavailable" || (!data && Boolean(error));
  const degraded = data?.status === "degraded" || stale;
  const tone = unavailable
    ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-200"
    : degraded
      ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-200"
      : "border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200";
  const label = unavailable ? "Network providers unavailable" : degraded ? "Network providers degraded" : "Networks operational";

  return (
    <div className={`flex min-h-10 items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm ${tone}`} role={unavailable ? "alert" : "status"} aria-live="polite">
      <div className="min-w-0">
        <span className="font-medium">{label}</span>
        {stale ? <span className="ml-2 text-xs opacity-80">Status is stale</span> : null}
      </div>
      <button type="button" onClick={() => void refresh()} className="shrink-0 rounded-lg px-2.5 py-1.5 font-medium outline-none hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-white/10">
        Refresh
      </button>
    </div>
  );
}
