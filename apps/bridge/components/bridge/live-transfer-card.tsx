"use client";

import { BridgeProgress, type BridgeProgressStep } from "./bridge-progress";
import { InlineAlert } from "../ui/inline-alert";
import { useTransferStatus } from "../../hooks/use-transfer-status";
import { CopyAddress } from "./copy-address";
import { StatusRecoveryActions } from "./status-recovery-actions";
import { TransferActivityList } from "./transfer-activity-list";
import { ScreenReaderStatus } from "../ui/screen-reader-status";
import { TransferStatusChip } from "./transfer-status-chip";
import { TRANSFER_PROGRESS_ORDER, isTerminalTransferStatus, transferStatusLabel } from "../../lib/bridge/transfer-status";

export function LiveTransferCard({ transferId }: { transferId: string }) {
  const { snapshot, connection, error, lastUpdatedAt, stale, online, refresh } = useTransferStatus(transferId);
  const status = snapshot?.status ?? "CREATED";
  const steps = progress(status, snapshot?.events?.map((event) => String(event.status ?? "")) ?? []);
  return <section className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-950" aria-labelledby="live-transfer-title">
    <ScreenReaderStatus message={`Transfer status ${transferStatusLabel(status)}. ${connection === "offline" ? "Tracking paused while offline." : stale ? "Status update delayed." : ""}`} />
    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Transfer status</p><h2 id="live-transfer-title" className="mt-1 truncate text-base font-semibold text-slate-950 dark:text-white">{transferId}</h2></div><div className="flex flex-col items-end gap-2"><ConnectionBadge connection={connection} terminal={isTerminalTransferStatus(status)} /><TransferStatusChip status={status} /></div></div>
    {!online ? <div className="mt-4"><InlineAlert title="You are offline" tone="warning">Transfer tracking is paused on this device until connectivity returns. Do not resubmit the transfer.</InlineAlert></div> : null}
    {error ? <div className="mt-4"><InlineAlert title="Live updates interrupted" tone="warning">{error}</InlineAlert></div> : null}
    {stale ? <div className="mt-4"><InlineAlert title="Status update delayed" tone="warning">No fresh update has arrived for more than 30 seconds. This does not mean the transfer failed. <button type="button" onClick={() => void refresh()} className="font-bold underline underline-offset-2">Check now</button></InlineAlert></div> : null}
    {status === "RECONCILIATION_REQUIRED" ? <div className="mt-4"><InlineAlert title="Reconciliation required" tone="warning">The destination state needs backend reconciliation before completion. Do not submit another transfer.</InlineAlert></div> : null}
    {status === "FAILED" ? <div className="mt-4"><InlineAlert title="Transfer needs attention" tone="warning">Review the persisted transfer status before retrying. A failed UI update is not proof that an on-chain submission did not occur.</InlineAlert></div> : null}
    <div className="mt-5"><BridgeProgress steps={steps} /><div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800"><TransferActivityList events={snapshot?.events ?? []} /><div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800"><div className="mb-3 flex items-center justify-between gap-3"><span className="text-xs font-medium text-slate-500">Transfer ID</span><CopyAddress value={transferId} label="transfer ID" /></div><StatusRecoveryActions status={status} transferId={transferId} onRetryStatus={() => void refresh()} /></div></div></div>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-500 dark:bg-slate-900/60 dark:text-slate-400" aria-live="polite"><span>Current state: <strong className="font-semibold text-slate-800 dark:text-slate-200">{transferStatusLabel(status)}</strong>{snapshot?.version ? ` · version ${snapshot.version}` : ""}</span>{lastUpdatedAt ? <span>Updated {relativeAge(lastUpdatedAt)}</span> : null}</div>
  </section>;
}

function ConnectionBadge({ connection, terminal }: { connection: "idle"|"live"|"polling"|"offline"|"error"; terminal: boolean }) { const live=connection==="live"; const label=terminal?"Final":live?"Live":connection==="polling"?"Polling":connection==="offline"?"Offline":connection==="error"?"Retrying":"Connecting"; return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${live ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300" : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"}`}><span className={`h-1.5 w-1.5 rounded-full ${live ? "bg-emerald-500" : "bg-slate-400"}`} aria-hidden="true" />{label}</span>; }
function relativeAge(timestamp: number) { const seconds=Math.max(0,Math.floor((Date.now()-timestamp)/1000)); if(seconds<5)return "just now"; if(seconds<60)return `${seconds}s ago`; return `${Math.floor(seconds/60)}m ago`; }
function progress(status: string, eventStatuses: string[]): BridgeProgressStep[] {
  const labels=["Quote accepted","Source submitted","Source finalized","Bridge message observed","Destination submitted","Destination finalized","Completed"];
  const known=[...eventStatuses,status].map((value)=>TRANSFER_PROGRESS_ORDER.indexOf(value as (typeof TRANSFER_PROGRESS_ORDER)[number])).filter((value)=>value>=0); const index=known.length?Math.max(...known):0; const terminalFailure=status==="FAILED"||status==="RECONCILIATION_REQUIRED";
  return labels.map((label,i)=>({id:TRANSFER_PROGRESS_ORDER[i] ?? String(i),label,description:i===0?"Transfer intent persisted.":i===6?"Finality and reconciliation completed.":undefined,state:terminalFailure&&i===index?"error":i<index?"complete":!terminalFailure&&i===index?"current":"upcoming"}));
}
