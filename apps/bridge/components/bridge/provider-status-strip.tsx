"use client";

import { useProviderHealth } from "@/hooks/use-provider-health";

export function ProviderStatusStrip() {
  const { data, error, loading, refreshing, stale, payloadAgeMs, online, lastSuccessfulAt, refresh } = useProviderHealth();
  if (loading && !data) return <div className="h-10 w-48 animate-pulse rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900" aria-label="Checking network providers" />;

  const unavailable = data?.status === "unavailable" || (!data && Boolean(error));
  const degraded = data?.status === "degraded" || stale;
  const label = !online ? "Device offline" : unavailable ? "Network providers unavailable" : degraded ? "Network providers degraded" : "Networks operational";
  const dot = !online ? "bg-amber-500" : unavailable ? "bg-rose-500" : degraded ? "bg-amber-500" : "bg-[#1c4334]";
  const freshness = Number.isFinite(payloadAgeMs) ? payloadAgeMs < 5_000 ? "just now" : `${Math.max(1, Math.round(payloadAgeMs / 1_000))}s ago` : null;

  return (
    <div className="flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200" role={unavailable ? "alert" : "status"} aria-live="polite" aria-busy={refreshing}>
      <span className={`size-2 rounded-full ${dot}`} />
      <span className="font-semibold">{label}</span>
      {freshness ? <span className="hidden text-slate-400 md:inline">Checked {freshness}</span> : null}
      {stale ? <span className="hidden text-amber-600 md:inline dark:text-amber-300">Status is stale</span> : null}
      {!online && lastSuccessfulAt ? <span className="hidden text-slate-400 lg:inline">Last successful snapshot retained</span> : null}
      <button type="button" onClick={() => { if (online) void refresh(); }} disabled={refreshing} aria-disabled={!online} className="ml-1 rounded-lg px-1.5 py-1 font-medium text-[#294a3b] outline-none hover:bg-[#f1f4f2] focus-visible:ring-2 focus-visible:ring-[#35584a] disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#d0dcd6] dark:hover:bg-[#09110e]/60">
        {!online ? "Offline" : refreshing ? "Checking…" : "Refresh"}
      </button>
    </div>
  );
}
