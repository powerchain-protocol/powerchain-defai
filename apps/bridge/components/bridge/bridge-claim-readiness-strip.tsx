import Link from "next/link";

export function BridgeClaimReadinessStrip({ claimStatus, runtimeReady = true, stale = false }: { claimStatus?: string | null; runtimeReady?: boolean; stale?: boolean }) {
  const blocked = !runtimeReady || stale;
  return <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950" aria-label="Bridge and claim readiness">
    <div className="grid gap-3 sm:grid-cols-3 sm:items-center">
      <div><div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bridge asset</div><div className="mt-1 font-semibold">PWRC ↔ wPWRC</div><div className="text-xs text-slate-500">Wormhole NTT · principal 1:1</div></div>
      <div><div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Claim</div><div className="mt-1 font-semibold">{claimStatus || "Check eligibility"}</div><div className="text-xs text-slate-500">Server-authoritative</div></div>
      <div className="flex gap-2 sm:justify-end"><Link href="/bridge" aria-disabled={blocked} className={`min-h-10 rounded-xl px-3.5 py-2.5 text-sm font-semibold ${blocked?"pointer-events-none bg-slate-100 text-slate-400 dark:bg-slate-900":"bg-[#0B1730] text-white"}`}>{blocked?"Refresh required":"Bridge"}</Link><Link href="/claim" className="min-h-10 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold dark:border-slate-700">Claim</Link></div>
    </div>
  </section>;
}
