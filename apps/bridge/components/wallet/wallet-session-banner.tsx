"use client";

import { shortIdentifier } from "../../lib/ui/activity-format";

export function WalletSessionBanner({ solanaAddress, suiAddress, walletChanged = false, refreshing = false, onRefresh }: { solanaAddress?: string | null; suiAddress?: string | null; walletChanged?: boolean; refreshing?: boolean; onRefresh?: () => void }) {
  const connected = Boolean(solanaAddress || suiAddress);
  if (!connected && !walletChanged) return null;
  return (
    <section className={`rounded-2xl border p-4 ${walletChanged ? "border-amber-300 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/20" : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"}`} aria-live="polite">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Wallet session</div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-700 dark:text-slate-300">
            {solanaAddress ? <span>Solana <span className="font-mono">{shortIdentifier(solanaAddress)}</span></span> : null}
            {suiAddress ? <span>Sui <span className="font-mono">{shortIdentifier(suiAddress)}</span></span> : null}
          </div>
          {walletChanged ? <p className="mt-2 text-sm font-medium text-amber-900 dark:text-amber-200">Wallet identity changed. Refresh balances and eligibility before opening a new signature.</p> : null}
        </div>
        {onRefresh ? <button type="button" onClick={onRefresh} disabled={refreshing} className="min-h-10 rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-wait disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">{refreshing ? "Refreshing…" : "Refresh session"}</button> : null}
      </div>
    </section>
  );
}
