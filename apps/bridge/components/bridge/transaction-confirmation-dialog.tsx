"use client";

import { useEffect, useRef } from "react";
import { BridgeTransactionSummary, type BridgeTransactionSummaryProps } from "./bridge-transaction-summary";
import { QuoteExpiryBanner } from "./quote-expiry-banner";
import { ScreenReaderStatus } from "../ui/screen-reader-status";

export function TransactionConfirmationDialog({ open, summary, busy = false, quoteExpiresAt, quoteExpired = false, refreshingQuote = false, onRefreshQuote, onCancel, onConfirm }: { open: boolean; summary: BridgeTransactionSummaryProps; busy?: boolean; quoteExpiresAt?: string | Date | null; quoteExpired?: boolean; refreshingQuote?: boolean; onRefreshQuote?: () => void; onCancel: () => void; onConfirm: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
      queueMicrotask(() => confirmRef.current?.focus());
    } else if (!open && dialog.open) {
      dialog.close();
      queueMicrotask(() => returnFocusRef.current?.focus());
    }
  }, [open]);
  return (
    <dialog ref={dialogRef} aria-labelledby="bridge-confirm-title" aria-describedby="bridge-confirm-help" onClose={() => { if (!open) queueMicrotask(() => returnFocusRef.current?.focus()); }} onCancel={(event) => { event.preventDefault(); if (!busy) onCancel(); }} className="m-auto w-[calc(100%-2rem)] max-w-xl rounded-[24px] border border-slate-200 bg-white p-0 text-slate-950 shadow-2xl backdrop:bg-slate-950/45 dark:border-slate-800 dark:bg-slate-950 dark:text-white">
      <ScreenReaderStatus message={busy ? "Wallet signature requested" : quoteExpired ? "Quote expired. Refresh the quote before signing." : "Transfer review ready"} />
      <div className="max-h-[min(82vh,760px)] overflow-y-auto p-4 sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Final review</p><h2 id="bridge-confirm-title" className="mt-1 text-xl font-semibold">Confirm bridge transfer</h2></div><button type="button" onClick={onCancel} disabled={busy} aria-label="Close review" className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-40 dark:hover:bg-slate-900">×</button></div>
        <BridgeTransactionSummary {...summary} />
        {quoteExpiresAt && onRefreshQuote ? <div className="mt-4"><QuoteExpiryBanner expiresAt={quoteExpiresAt} refreshing={refreshingQuote} onRefresh={onRefreshQuote} /></div> : null}
        <div id="bridge-confirm-help" className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-3 text-xs leading-5 text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">Verify the destination wallet and fee recipient before signing. PowerChain cannot reverse a finalized blockchain transaction.</div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" disabled={busy} onClick={onCancel} className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900">Back</button><button ref={confirmRef} type="button" disabled={busy || quoteExpired} onClick={onConfirm} aria-busy={busy || undefined} className="min-h-11 rounded-xl bg-[#0B1730] px-5 text-sm font-semibold text-white hover:bg-[#122447] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500">{busy ? "Waiting for wallet…" : quoteExpired ? "Refresh quote first" : "Confirm & sign"}</button></div>
      </div>
    </dialog>
  );
}
