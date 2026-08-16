"use client";

import { useMemo, useState } from "react";
import { TransactionDetailDrawer, type TransactionDetail } from "./transaction-detail-drawer";

type Activity = Record<string, unknown>;

export function CrossChainActivityList({ activity, loading, error, hasNextPage, onLoadMore, onRefresh }: { activity: Activity[]; loading?: boolean; error?: string | null; hasNextPage?: boolean; onLoadMore?: () => void; onRefresh?: () => void }) {
  const [chain, setChain] = useState<"ALL" | "SOLANA" | "SUI">("ALL");
  const [selected, setSelected] = useState<TransactionDetail | null>(null);
  const filtered = useMemo(() => activity.filter((row) => chain === "ALL" || String(row.chain || "").toUpperCase() === chain), [activity, chain]);

  return <><section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950" aria-labelledby="cross-chain-activity-title">
    <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
      <div><h2 id="cross-chain-activity-title" className="font-semibold">Cross-chain activity</h2><p className="mt-1 text-xs text-slate-500">Wallet/indexer activity for navigation and support. Not bridge accounting evidence.</p></div>
      <div className="flex flex-wrap items-center gap-2"><div className="flex rounded-lg border border-slate-200 p-1 dark:border-slate-700" role="group" aria-label="Filter activity by chain">{(["ALL","SOLANA","SUI"] as const).map((item)=><button key={item} type="button" onClick={()=>setChain(item)} aria-pressed={chain===item} className={`min-h-9 rounded-md px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] ${chain===item?"bg-slate-900 text-white dark:bg-white dark:text-slate-900":"text-slate-600 dark:text-slate-300"}`}>{item==="ALL"?"All":item==="SOLANA"?"Solana":"Sui"}</button>)}</div>{onRefresh?<button type="button" onClick={onRefresh} disabled={loading} className="min-h-10 rounded-lg border border-slate-200 px-3 text-xs font-semibold disabled:opacity-50 dark:border-slate-700">{loading?"Refreshing…":"Refresh"}</button>:null}</div>
    </div>
    {error?<div role="alert" className="p-4 text-sm text-rose-700 dark:text-rose-300">{error}</div>:filtered.length?<div className="divide-y divide-slate-100 dark:divide-slate-900">{filtered.map((row,index)=><ActivityRow key={`${activityId(row)}-${index}`} row={row} onOpen={()=>setSelected(toDetail(row))}/>)}</div>:<div className="p-8 text-center"><div className="text-sm font-semibold">No activity found</div><p className="mt-1 text-sm text-slate-500">Finalized Solana or Sui activity will appear here when indexed.</p></div>}
    {hasNextPage&&onLoadMore?<div className="border-t border-slate-200 p-3 text-center dark:border-slate-800"><button type="button" disabled={loading} onClick={onLoadMore} className="min-h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold disabled:opacity-50 dark:border-slate-700">{loading?"Loading…":"Load more"}</button></div>:null}
  </section><TransactionDetailDrawer detail={selected} open={Boolean(selected)} onClose={()=>setSelected(null)} /></>;
}

function activityId(row: Activity) { return String(row.signature || row.digest || row.id || "activity"); }
function short(v: string) { return v.length > 16 ? `${v.slice(0,7)}…${v.slice(-7)}` : v; }
function toDetail(row: Activity): TransactionDetail { return { chain:String(row.chain||"UNKNOWN").toUpperCase(), id:activityId(row), title:String(row.label||row.description||row.type||"Transaction"), status:String(row.status||row.executionStatus||"Indexed"), timestamp:String(row.timestamp||row.blockTime||row.createdAt||""), explorerUrl:typeof row.explorerUrl==="string"?row.explorerUrl:typeof row.url==="string"?row.url:null, source:typeof row.source==="string"?row.source:null, amountLabel:typeof row.amountLabel==="string"?row.amountLabel:null }; }
function ActivityRow({row,onOpen}:{row:Activity;onOpen:()=>void}) {
  const chain=String(row.chain||"UNKNOWN").toUpperCase(); const title=String(row.label||row.description||row.type||"Transaction"); const id=activityId(row); const status=String(row.status||row.executionStatus||"").toUpperCase();
  return <div className="grid gap-3 px-4 py-3 sm:grid-cols-[88px_1fr_auto] sm:items-center"><div><span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-300">{chain}</span></div><div className="min-w-0"><div className="truncate text-sm font-medium">{title}</div><div className="mt-0.5 flex min-w-0 items-center gap-2"><span className="truncate font-mono text-xs text-slate-500">{short(id)}</span>{status?<span className="shrink-0 text-[11px] font-semibold text-slate-500">{status}</span>:null}</div></div><button type="button" onClick={onOpen} className="min-h-10 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-[#294a3b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] dark:border-slate-700">Details</button></div>;
}
