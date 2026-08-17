"use client";

import { APP_ROUTES } from "@/config/app-routes";

import { transferNeedsAttention } from "../../lib/bridge/transfer-status";

export function StatusRecoveryActions({ status, transferId, onRetryStatus, retrying = false }: { status: string; transferId: string; onRetryStatus?: () => void; retrying?: boolean }) {
  const attention = transferNeedsAttention(status);
  const detailHref = `/bridge/status/${encodeURIComponent(transferId)}`;
  return <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap"><a href={detailHref} className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900">Open transfer details</a>{onRetryStatus ? <button type="button" onClick={onRetryStatus} disabled={retrying} className="min-h-10 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900">{retrying ? "Checking…" : "Check status now"}</button> : null}{attention ? <a href={APP_ROUTES.status} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-amber-50 px-4 text-sm font-semibold text-amber-800 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:bg-amber-950/30 dark:text-amber-200">View bridge status</a> : null}</div>;
}
