"use client";

import type {ClaimLifecycleState} from "../../lib/claim/claim-lifecycle";
import {claimStateNeedsStatusRecovery} from "../../lib/claim/claim-lifecycle";

const LABEL: Record<ClaimLifecycleState, string> = {
  IDLE:"Ready", CHECKING_ELIGIBILITY:"Checking eligibility", ELIGIBLE:"Eligible",
  NOT_ELIGIBLE:"Not eligible", ALREADY_CLAIMED:"Already claimed", RESERVING:"Reserving claim",
  RESERVED:"Reserved", SIGNING:"Awaiting wallet signature", SUBMITTING:"Submitting",
  SUBMITTED:"Submitted", FINALIZED:"Finalized", EXPIRED:"Reservation expired",
  FAILED:"Claim failed", UNKNOWN:"Submission outcome unknown",
};

export function ClaimLifecycleCard({state, claimable, reservationExpiresAt, onRefresh, onCheckStatus}:{
  state: ClaimLifecycleState; claimable?: string; reservationExpiresAt?: string | null;
  onRefresh?:()=>void; onCheckStatus?:()=>void;
}) {
  const recovery = claimStateNeedsStatusRecovery(state);
  return <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950" aria-labelledby="claim-lifecycle-title">
    <div className="flex items-start justify-between gap-3">
      <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Claim</p><h2 id="claim-lifecycle-title" className="mt-1 text-base font-semibold text-slate-950 dark:text-white">{LABEL[state]}</h2></div>
      {claimable ? <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">{claimable} PWRC</span> : null}
    </div>
    {reservationExpiresAt && state === "RESERVED" ? <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Reservation expires at <time dateTime={reservationExpiresAt}>{reservationExpiresAt}</time>.</p> : null}
    {state === "UNKNOWN" ? <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">Do not submit again. Check the existing claim status first.</p> : null}
    <div className="mt-4 flex flex-wrap gap-2">
      {recovery && onCheckStatus ? <button type="button" onClick={onCheckStatus} className="min-h-11 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">Check status</button> : null}
      {onRefresh && !recovery ? <button type="button" onClick={onRefresh} className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold dark:border-slate-700">Refresh</button> : null}
    </div>
  </section>;
}
