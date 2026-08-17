"use client";

import type { ClaimLifecycleState } from "../../lib/claim/claim-lifecycle";
import { claimStateNeedsStatusRecovery } from "../../lib/claim/claim-lifecycle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/utils/helpers";

const LABEL: Record<ClaimLifecycleState, string> = {
  IDLE: "Ready", CHECKING_ELIGIBILITY: "Checking eligibility", ELIGIBLE: "Eligible",
  NOT_ELIGIBLE: "Not eligible", ALREADY_CLAIMED: "Already claimed", RESERVING: "Reserving claim",
  RESERVED: "Reserved", SIGNING: "Awaiting wallet signature", SUBMITTING: "Submitting",
  SUBMITTED: "Submitted", FINALIZED: "Finalized", EXPIRED: "Reservation expired",
  FAILED: "Claim failed", UNKNOWN: "Submission outcome unknown",
};

export function ClaimLifecycleCard({ state, claimable, reservationExpiresAt, onRefresh, onCheckStatus }: {
  state: ClaimLifecycleState;
  claimable?: string;
  reservationExpiresAt?: string | null;
  onRefresh?: () => void;
  onCheckStatus?: () => void;
}) {
  const recovery = claimStateNeedsStatusRecovery(state);
  return <Card aria-labelledby="claim-lifecycle-title">
    <CardHeader>
      <div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#557568]">Claim</p><CardTitle id="claim-lifecycle-title" className="mt-1">{LABEL[state]}</CardTitle></div>
      {claimable ? <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">{claimable} PWRC</span> : null}
    </CardHeader>
    <CardContent className="space-y-4">
      {reservationExpiresAt && state === "RESERVED" ? <p className="text-sm text-slate-600 dark:text-slate-300">Reservation expires <time dateTime={reservationExpiresAt}>{formatDateTime(reservationExpiresAt)}</time>.</p> : null}
      {state === "UNKNOWN" ? <p className="rounded-[var(--pc-radius-control)] border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/25 dark:text-amber-200">Do not submit again. Check the existing claim status first.</p> : null}
      <div className="flex flex-wrap gap-2">
        {recovery && onCheckStatus ? <Button variant="primary" onClick={onCheckStatus}>Check status</Button> : null}
        {onRefresh && !recovery ? <Button onClick={onRefresh}>Refresh</Button> : null}
      </div>
    </CardContent>
  </Card>;
}
