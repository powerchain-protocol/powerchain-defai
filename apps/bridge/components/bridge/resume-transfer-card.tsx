"use client";

import { useResumableTransfer } from "@/hooks/use-resumable-transfer";

export function ResumeTransferCard() {
  const { active, clear } = useResumableTransfer();
  if (!active) return null;
  return <aside className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/20" aria-label="Resume active transfer"><p className="text-sm font-semibold text-slate-950 dark:text-white">Transfer in progress</p><p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Resume the persisted transfer instead of starting a duplicate after reloading the app.</p><div className="mt-3 flex flex-wrap gap-2"><a href={`/bridge/status/${encodeURIComponent(active.transferId)}`} className="inline-flex min-h-10 items-center rounded-xl bg-[#0B1730] px-3 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">Resume transfer</a><button type="button" onClick={clear} className="min-h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">Dismiss</button></div></aside>;
}
