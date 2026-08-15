"use client";

import { useBridgeRuntime } from "@/hooks/use-bridge-runtime";

const LABELS: Record<string, string> = {
  "solana-finalized": "Solana finalized data",
  "sui-checkpoint": "Sui checkpoint data",
  "provider-redundancy": "Provider redundancy",
  "asset-integrity": "PWRC asset integrity",
};

export function BridgeRuntimeGate() {
  const { data, loading, error, online, stale, canRequestQuote, canOpenWalletSignature, canSubmitTransfer, refresh } = useBridgeRuntime();
  const blocked = !online || stale || data?.status === "blocked" || (!data && Boolean(error));
  const degraded = !blocked && data?.status === "degraded";
  const tone = blocked
    ? "border-red-200 bg-red-50 dark:border-red-900/70 dark:bg-red-950/30"
    : degraded
      ? "border-amber-200 bg-amber-50 dark:border-amber-900/70 dark:bg-amber-950/30"
      : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950";
  const title = !online ? "Offline" : stale && data ? "Runtime decision expired" : blocked ? "Bridge temporarily unavailable" : degraded ? "Bridge available with reduced redundancy" : "Bridge operational";

  return (
    <section className={`rounded-[18px] border p-4 ${tone}`} aria-labelledby="bridge-runtime-title" role={blocked ? "alert" : "status"}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id="bridge-runtime-title" className="text-sm font-semibold text-slate-950 dark:text-white">{title}</h2>
          <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
            {loading && !data ? "Checking fresh chain heads, provider readiness and PWRC asset identity…" : stale && data ? "Runtime safety data is too old for a new quote or signature. Refresh before continuing." : blocked ? "New quotes, wallet signatures and transfer submissions remain blocked until required checks recover." : "Fresh chain data and asset identity checks are available for the bridge flow."}
          </p>
        </div>
        <button type="button" onClick={() => void refresh()} disabled={loading || !online} className="min-h-9 shrink-0 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900">
          {loading ? "Checking…" : "Refresh"}
        </button>
      </div>

      {data?.checks?.length ? (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {data.checks.map((check) => (
            <li key={check.id} className="rounded-xl border border-black/5 bg-white/70 px-3 py-2 text-xs dark:border-white/10 dark:bg-slate-950/50">
              <div className="flex items-center gap-2">
                <span aria-hidden="true" className={`h-2 w-2 rounded-full ${check.ok ? "bg-emerald-500" : check.blocking ? "bg-red-500" : "bg-amber-500"}`} />
                <span className="font-medium text-slate-800 dark:text-slate-100">{LABELS[check.id] ?? check.id}</span>
              </div>
              {check.detail ? <p className="mt-1 truncate text-slate-500 dark:text-slate-400" title={check.detail}>{check.detail}</p> : null}
            </li>
          ))}
        </ul>
      ) : null}

      {data ? (
        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          <span className={`rounded-full px-2 py-1 ${canRequestQuote ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-slate-900"}`}>Quotes {canRequestQuote ? "enabled" : "blocked"}</span>
          <span className={`rounded-full px-2 py-1 ${canOpenWalletSignature ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-slate-900"}`}>Signing {canOpenWalletSignature ? "enabled" : "blocked"}</span>
          <span className={`rounded-full px-2 py-1 ${canSubmitTransfer ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-slate-900"}`}>Submit {canSubmitTransfer ? "enabled" : "blocked"}</span>
        </div>
      ) : null}
      {data ? <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">Runtime checks are operational safety signals only; persisted reconciliation evidence remains authoritative for bridge accounting.</p> : null}
      {error && !blocked ? <p className="mt-2 text-xs text-amber-800 dark:text-amber-200">{error}</p> : null}
    </section>
  );
}
