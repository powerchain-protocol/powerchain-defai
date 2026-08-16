"use client";

import { usePwrcIntegrity } from "@/hooks/use-pwrc-integrity";

function ChainState({ name, ok, detail }: { name: string; ok?: boolean; detail?: string | null }) {
  return <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-800">
    <div className="min-w-0">
      <p className="text-sm font-medium text-slate-950 dark:text-white">{name}</p>
      {detail ? <p className="truncate text-xs text-slate-500 dark:text-slate-400">{detail}</p> : null}
    </div>
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${ok ? "bg-[#f1f4f2] text-[#294a3b] dark:bg-[#09110e]/60 dark:text-[#d0dcd6]" : "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"}`}>
      {ok ? "Verified" : "Attention"}
    </span>
  </div>;
}

export function AssetIntegrityCard() {
  const { data, loading, error, refresh } = usePwrcIntegrity();
  return <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950" aria-labelledby="asset-integrity-title">
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 id="asset-integrity-title" className="text-sm font-semibold text-slate-950 dark:text-white">Asset integrity</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Checks configured PWRC/wPWRC identities against live chain metadata. This is operational validation, not bridge accounting evidence.</p>
      </div>
      <button type="button" onClick={() => void refresh()} disabled={loading} className="min-h-9 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900">
        {loading ? "Checking…" : "Recheck"}
      </button>
    </div>
    <div className="mt-4 space-y-2" aria-live="polite">
      <ChainState name="Solana PWRC" ok={data?.solana?.ok} detail={data?.solana?.data?.finalizedSlot ? `Finalized slot ${data.solana.data.finalizedSlot}${typeof data.solana.data.headAgeMs === "number" ? ` · ${Math.round(data.solana.data.headAgeMs / 1000)}s old` : ""}` : data?.solana?.error} />
      <ChainState name="Sui wPWRC" ok={data?.sui?.ok} detail={data?.sui?.data?.chainIdentifier ? `Chain ${data.sui.data.chainIdentifier}${typeof data.sui.data.headAgeMs === "number" ? ` · ${Math.round(data.sui.data.headAgeMs / 1000)}s old` : ""}` : data?.sui?.error} />
    </div>
    {data?.assetFingerprint ? <p className="mt-3 break-all font-mono text-[11px] text-slate-500 dark:text-slate-400">Asset fingerprint {data.assetFingerprint}</p> : null}
    {error ? <p className="mt-3 text-xs font-medium text-amber-700 dark:text-amber-300">{error}</p> : null}
  </section>;
}
