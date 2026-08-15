"use client";
import { usePwrcLiveData } from "@/hooks/use-pwrc-live-data";

type Props = { solanaOwner?: string; suiOwner?: string };
function text(value: unknown) { return typeof value === "string" ? value : "—"; }
export function LiveChainDataCard({ solanaOwner, suiOwner }: Props) {
  const { data, loading, error, refresh } = usePwrcLiveData(solanaOwner, suiOwner);
  const root = (data && typeof data === "object") ? data as Record<string, any> : {};
  const solana = root.solana?.ok ? root.solana.data : null;
  const sui = root.sui?.ok ? root.sui.data : null;
  const market = root.market?.ok ? root.market.data : null;
  return <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950" aria-labelledby="live-chain-data-title">
    <div className="flex items-start justify-between gap-3">
      <div><h2 id="live-chain-data-title" className="text-sm font-semibold text-slate-950 dark:text-white">Live network data</h2><p className="mt-1 text-xs text-slate-500">Finalized chain reads. Market price is informational only.</p></div>
      <button type="button" onClick={() => void refresh()} className="min-h-9 rounded-lg border border-slate-200 px-3 text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700">Refresh</button>
    </div>
    {error ? <p role="alert" className="mt-3 text-sm text-amber-700 dark:text-amber-300">{error}</p> : null}
    <div className="mt-4 grid gap-3 sm:grid-cols-3" aria-busy={loading}>
      <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900"><p className="text-xs text-slate-500">PWRC on Solana</p><p className="mt-1 font-mono text-sm tabular-nums">{text(solana?.balance ?? solana?.supply)}</p><p className="mt-1 text-[11px] text-slate-500">slot {text(solana?.balanceContextSlot ?? solana?.finalizedSlot)}</p></div>
      <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900"><p className="text-xs text-slate-500">wPWRC on Sui</p><p className="mt-1 font-mono text-sm tabular-nums">{text(sui?.balance)}</p><p className="mt-1 text-[11px] text-slate-500">checkpoint {text(sui?.latestCheckpoint)}</p></div>
      <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900"><p className="text-xs text-slate-500">PWRC / USD</p><p className="mt-1 font-mono text-sm tabular-nums">{market ? `$${text(market.price)}` : "Unavailable"}</p><p className="mt-1 text-[11px] text-slate-500">{market ? `${text(market.source)} · market data` : "Configure Pyth/Birdeye"}</p></div>
    </div>
    <p className="mt-3 text-[11px] leading-4 text-slate-500">These reads help the interface display balances and market context. Bridge completion and backing conservation continue to use persisted, independently verified evidence.</p>
  </section>;
}
