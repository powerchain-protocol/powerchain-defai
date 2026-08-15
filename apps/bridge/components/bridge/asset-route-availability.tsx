"use client";

export type AssetRouteState = "READY" | "DEGRADED" | "PAUSED" | "UNAVAILABLE";

export function AssetRouteAvailability({state, integrityHealthy, runtimeFresh, onRefresh}:{state:AssetRouteState; integrityHealthy:boolean; runtimeFresh:boolean; onRefresh?:()=>void}) {
  const blocked = state === "PAUSED" || state === "UNAVAILABLE" || !integrityHealthy || !runtimeFresh;
  return <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950" aria-label="PWRC bridge route availability">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="font-semibold text-slate-950 dark:text-white">PWRC ↔ wPWRC</p><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Wormhole NTT · principal 1:1</p></div>
      <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold dark:border-slate-700">{blocked ? "Action blocked" : state === "DEGRADED" ? "Degraded" : "Ready"}</span>
    </div>
    {!integrityHealthy ? <p className="mt-3 text-sm text-red-700 dark:text-red-300">PWRC/wPWRC asset integrity must pass before a new bridge action.</p> : null}
    {!runtimeFresh ? <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">Runtime decision is stale. Refresh before requesting a quote.</p> : null}
    {state === "DEGRADED" ? <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">Provider redundancy is reduced. Existing status/recovery reads remain available.</p> : null}
    {onRefresh && (blocked || state === "DEGRADED") ? <button type="button" onClick={onRefresh} className="mt-4 min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold dark:border-slate-700">Refresh route state</button> : null}
  </section>;
}
