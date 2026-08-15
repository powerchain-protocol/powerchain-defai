import Link from "next/link";
export function BridgeAssetSummary() {
  return <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950" aria-labelledby="bridge-assets-title">
    <div className="flex items-start justify-between gap-4"><div><h2 id="bridge-assets-title" className="text-sm font-semibold">Bridge assets</h2><p className="mt-1 text-xs text-slate-500">PWRC on Solana ↔ wPWRC on Sui via Wormhole NTT.</p></div><Link href="/assets" className="text-xs font-semibold text-blue-600 hover:underline">Asset details</Link></div>
    <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3"><div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900"><div className="text-xs text-slate-500">Solana</div><div className="mt-1 font-semibold">PWRC</div><div className="text-[11px] text-blue-600">Native</div></div><div className="text-slate-400" aria-label="one to one">↔</div><div className="rounded-xl bg-slate-50 p-3 text-right dark:bg-slate-900"><div className="text-xs text-slate-500">Sui</div><div className="mt-1 font-semibold">wPWRC</div><div className="text-[11px] text-blue-600">Bridged</div></div></div>
    <div className="mt-3 flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-900 dark:bg-blue-950/30 dark:text-blue-100"><span>Principal conversion</span><strong>1:1</strong></div>
  </section>;
}
