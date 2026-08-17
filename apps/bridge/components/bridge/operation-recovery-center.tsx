"use client";

import Link from "next/link";
import { useOperationJournal } from "../../hooks/use-operation-journal";
import { useOperationStatusReconciler } from "../../hooks/use-operation-status-reconciler";
import { deriveOperationActionState } from "../../lib/bridge/operation-state";
import { operationAllowsDismiss, operationKindLabel, operationStatusLabel, operationStatusSummary } from "../../lib/bridge/operation-presentation";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClassName } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InlineAlert } from "@/components/ui/inline-alert";

function syncLabel(state: string) {
  if (state === "syncing") return "Checking server";
  if (state === "synced") return "Server synced";
  if (state === "offline") return "Offline";
  if (state === "conflict") return "Status conflict";
  return "Status recovery";
}

function syncTone(state: string): "neutral" | "success" | "warning" | "danger" {
  if (state === "synced") return "success";
  if (state === "conflict") return "danger";
  if (state === "offline") return "warning";
  return "neutral";
}

export function OperationRecoveryCenter({ currentWalletIdentity }: { currentWalletIdentity?: string }) {
  const journal = useOperationJournal();
  const record = journal.record;
  const sync = useOperationStatusReconciler(record);

  if (!record && journal.externalConflict) {
    return (
      <InlineAlert title="Operation conflict" tone="danger">
        <p>Another tab has an active {operationKindLabel(journal.externalConflict.record.kind).toLowerCase()}. Open its status before starting another mutation.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={journal.externalConflict.record.statusHref} className={buttonClassName({ variant: "danger", size: "md" })}>Open other status</Link>
          {operationAllowsDismiss(journal.externalConflict.record.status) ? (
            <Button variant="danger" onClick={journal.dismissExternalConflict}>Dismiss completed warning</Button>
          ) : null}
        </div>
      </InlineAlert>
    );
  }
  if (!record) return null;

  const action = deriveOperationActionState(record, currentWalletIdentity);
  return (
    <Card aria-live="polite">
      <CardContent className="pt-4 sm:pt-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[.12em] text-slate-500">Existing operation</p>
              {record.statusApiHref ? <Badge tone={syncTone(sync.state)}>{syncLabel(sync.state)}</Badge> : null}
            </div>
            <h2 className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">{operationKindLabel(record.kind)} · {operationStatusLabel(record.status)}</h2>
            <p className="mt-1 break-all font-mono text-[11px] text-slate-500">{record.id}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{operationStatusSummary(record.kind, record.status)}</p>
            {record.serverSnapshotId ? <p className="mt-1 text-xs text-slate-500">Server snapshot {record.serverSnapshotId}</p> : null}
            {action.reason ? <p className="mt-2 text-sm font-medium text-amber-700 dark:text-amber-300">{action.reason}</p> : null}
            {journal.externalConflict ? <p className="mt-2 text-sm font-medium text-rose-700 dark:text-rose-300">Another tab has a different active operation. Resolve one operation before starting another mutation.</p> : null}
            {sync.state === "conflict" ? (
              <p className="mt-2 text-sm font-medium text-rose-700 dark:text-rose-300">Server status revision conflict detected. Use the status page and do not start another mutation.</p>
            ) : sync.error ? (
              <p className="mt-2 text-xs text-slate-500">Automatic status refresh is temporarily unavailable. The existing status link remains safe to use.</p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {journal.externalConflict ? <Link href={journal.externalConflict.record.statusHref} className={buttonClassName({ variant: "danger" })}>Other operation</Link> : null}
            <Link href={record.statusHref} className={buttonClassName({ variant: "primary" })}>View status</Link>
            {record.statusApiHref ? (
              <Button onClick={() => void sync.refresh()} loading={sync.state === "syncing"} loadingLabel="Checking…">Refresh status</Button>
            ) : null}
            {action.terminal ? <Button variant="ghost" onClick={journal.clear}>Dismiss</Button> : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
