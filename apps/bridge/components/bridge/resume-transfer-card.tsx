"use client";

import { useResumableTransfer } from "@/hooks/use-resumable-transfer";

export function ResumeTransferCard() {
  const { active, clear } = useResumableTransfer();
  if (!active) return null;
  return <aside className="rounded-2xl border border-[#d4ddd8] bg-[#f1f4f2] p-4 dark:border-[#29483c] dark:bg-[#09110e]/40" aria-label="Resume active transfer"><p className="text-sm font-semibold text-slate-950 dark:text-white">Transfer in progress</p><p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Resume the persisted transfer instead of starting a duplicate after reloading the app.</p><div className="mt-3 flex flex-wrap gap-2"><a href={`/bridge/status/${encodeURIComponent(active.transferId)}`} className="inline-flex min-h-10 items-center rounded-xl bg-[#0b1511] px-3 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a]">Resume transfer</a><button type="button" onClick={clear} className="min-h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">Dismiss</button></div></aside>;
}
