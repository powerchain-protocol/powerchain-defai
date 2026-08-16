"use client";

import Link from "next/link";
import { useBridgedAssets } from "@/hooks/use-bridged-assets";

function shorten(value: string | null) {
  if (!value) return "Not configured";
  if (value.length <= 20) return value;
  return `${value.slice(0, 8)}…${value.slice(-8)}`;
}

export function BridgedAssetsCard() {
  const { data, loading, error, refresh } = useBridgedAssets();
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950" aria-labelledby="bridge-assets-title">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="bridge-assets-title" className="text-base font-semibold text-slate-950 dark:text-white">PowerChain bridge assets</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">PWRC is the Solana asset. wPWRC is its 1:1 Sui representation through Wormhole NTT.</p>
        </div>
        <button type="button" onClick={() => void refresh()} disabled={loading} className="min-h-10 rounded-xl border border-slate-200 px-3 text-sm font-medium disabled:opacity-50 dark:border-slate-700">{loading ? "Refreshing…" : "Refresh"}</button>
      </div>
      {error ? <div role="alert" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">{error}</div> : null}
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {(data?.assets ?? []).map((asset) => (
          <article key={asset.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-center justify-between gap-3">
              <div><div className="font-semibold text-slate-950 dark:text-white">{asset.symbol}</div><div className="text-xs uppercase tracking-wide text-slate-500">{asset.chain} · {asset.kind}</div></div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${asset.configured && asset.integrity ? "bg-[#f1f4f2] text-[#294a3b] dark:bg-[#09110e]/60 dark:text-[#d0dcd6]" : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"}`}>{asset.configured && asset.integrity ? "Verified" : asset.configured ? "Needs attention" : "Not configured"}</span>
            </div>
            <dl className="mt-4 space-y-2 text-sm"><div className="flex justify-between gap-3"><dt className="text-slate-500">Decimals</dt><dd className="font-mono tabular-nums">9</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Identifier</dt><dd className="max-w-[70%] truncate font-mono" title={asset.identifier ?? undefined}>{shorten(asset.identifier)}</dd></div></dl>
          </article>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-900">
        <div><strong>1 PWRC principal = 1 wPWRC principal.</strong> Service fees and network gas are separate.</div>
        <Link href="/bridge" className="font-semibold text-[#294a3b] hover:underline dark:text-[#adc0b6]">Bridge assets</Link>
      </div>
    </section>
  );
}
