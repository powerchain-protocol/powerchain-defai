"use client";

import { useQuoteExpiry } from "@/hooks/use-quote-expiry";

export function QuoteExpiryBanner({ expiresAt, refreshing = false, onRefresh }: { expiresAt: string | Date | null | undefined; refreshing?: boolean; onRefresh: () => void }) {
  const expiry = useQuoteExpiry(expiresAt);
  if (!expiresAt) return null;
  const urgent = expiry.seconds != null && expiry.seconds <= 30;
  return (
    <div className={`flex flex-col gap-3 rounded-2xl border p-3 sm:flex-row sm:items-center sm:justify-between ${expiry.expired || urgent ? "border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20" : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50"}`} role={expiry.expired ? "alert" : "status"}>
      <div>
        <p className="text-sm font-semibold text-slate-950 dark:text-white">{expiry.expired ? "Quote expired" : "Quote locked"}</p>
        <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{expiry.expired ? "Refresh before signing. The expired quote will not be submitted." : `Expires in ${expiry.label}. Amount, service fee and fee recipient stay fixed until then.`}</p>
      </div>
      <button type="button" onClick={onRefresh} disabled={refreshing} className="min-h-10 shrink-0 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900">{refreshing ? "Refreshing…" : expiry.expired ? "Refresh quote" : "Refresh"}</button>
    </div>
  );
}
