"use client";

import { useResumableTransfer } from "@/hooks/use-resumable-transfer";
import { CopyAddress } from "./copy-address";

export function ActiveTransferBanner() {
  const { active, clear } = useResumableTransfer();
  if (!active) return null;
  return <aside className="sticky top-2 z-30 rounded-2xl border border-blue-200 bg-white p-3 shadow-sm dark:border-blue-900 dark:bg-slate-950" aria-label="Active bridge transfer"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-600 dark:text-blue-400">Transfer in progress</p><div className="mt-1"><CopyAddress value={active.transferId} label="active transfer ID" /></div></div><div className="flex gap-2"><a href={`/bridge/status/${encodeURIComponent(active.transferId)}`} className="inline-flex min-h-10 items-center rounded-xl bg-[#0B1730] px-3 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-blue-600">View status</a><button type="button" onClick={clear} className="min-h-10 rounded-xl border border-slate-300 px-3 text-sm font-semibold text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:text-slate-300">Dismiss</button></div></div></aside>;
}
