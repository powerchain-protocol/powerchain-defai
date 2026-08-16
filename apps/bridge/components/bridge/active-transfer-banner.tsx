"use client";

import Link from "next/link";
import { useResumableTransfer } from "@/hooks/use-resumable-transfer";
import { CopyAddress } from "./copy-address";

export function ActiveTransferBanner() {
  const { active, clear } = useResumableTransfer();
  if (!active) return null;
  return <aside className="sticky top-20 z-30 lg:top-2 rounded-2xl border border-[#d4ddd8] bg-white p-3 shadow-sm dark:border-[#29483c] dark:bg-slate-950" aria-label="Active bridge transfer"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#294a3b] dark:text-[#adc0b6]">Transfer in progress</p><div className="mt-1"><CopyAddress value={active.transferId} label="active transfer ID" /></div></div><div className="flex gap-2"><Link href={`/bridge/status/${encodeURIComponent(active.transferId)}`} className="inline-flex min-h-10 items-center rounded-xl bg-[#0b1511] px-3 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] dark:bg-[#dfe7e3]">View status</Link><button type="button" onClick={clear} className="min-h-10 rounded-xl border border-slate-300 px-3 text-sm font-semibold text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] dark:border-slate-700 dark:text-slate-300">Dismiss</button></div></div></aside>;
}
