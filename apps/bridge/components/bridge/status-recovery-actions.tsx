"use client";

import Link from "next/link";
import { Button, buttonClassName } from "@/components/ui/button";
import { APP_ROUTES, bridgeStatusRoute } from "@/config/app-routes";
import { transferNeedsAttention } from "@/lib/bridge/transfer-status";

export function StatusRecoveryActions({ status, transferId, onRetryStatus, retrying = false }: { status: string; transferId: string; onRetryStatus?: () => void; retrying?: boolean }) {
  const attention = transferNeedsAttention(status);
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <Link href={bridgeStatusRoute(transferId)} className={buttonClassName({ variant: "secondary", size: "sm" })}>Open transfer details</Link>
      {onRetryStatus ? <Button size="sm" variant="secondary" onClick={onRetryStatus} loading={retrying} loadingLabel="Checking…">Check status now</Button> : null}
      {attention ? <Link href={APP_ROUTES.status} className={buttonClassName({ variant: "secondary", size: "sm", className: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/25 dark:text-amber-200" })}>View bridge status</Link> : null}
    </div>
  );
}
