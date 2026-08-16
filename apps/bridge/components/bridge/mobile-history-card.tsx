import { CopyAddress } from "./copy-address";
import { TransferStatusChip } from "./transfer-status-chip";

export function MobileHistoryCard({ transferId, route, amount, symbol = "PWRC", status, updatedAt, href }: { transferId: string; route: string; amount: string; symbol?: string; status: string; updatedAt?: string | null; href?: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{route}</p><div className="mt-1"><CopyAddress value={transferId} label="history transfer ID" /></div></div>
        <TransferStatusChip status={status} />
      </div>
      <div className="mt-3 flex items-end justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
        <div><p className="text-[10px] uppercase tracking-wide text-slate-400">Principal</p><p className="mt-0.5 text-sm font-semibold tabular-nums text-slate-950 dark:text-white">{amount} {symbol}</p>{updatedAt ? <p className="mt-1 text-[10px] text-slate-400">Updated {updatedAt}</p> : null}</div>
        {href ? <a href={href} className="inline-flex min-h-9 items-center rounded-lg px-2.5 text-xs font-bold text-[#294a3b] hover:bg-[#f1f4f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] dark:text-[#adc0b6] dark:hover:bg-[#09110e]/60">Details</a> : null}
      </div>
    </article>
  );
}
