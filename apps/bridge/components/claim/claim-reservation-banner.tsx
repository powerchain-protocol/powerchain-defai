"use client";

import {useClaimReservationExpiry} from "../../hooks/use-claim-reservation-expiry";
import {formatRemainingDuration} from "../../lib/ui/duration-format";

type Props={claimId:string;expiresAt?:string|null;onRefresh?:()=>void;refreshing?:boolean};

export function ClaimReservationBanner({claimId,expiresAt,onRefresh,refreshing=false}:Props){
  const {expired,remainingMs}=useClaimReservationExpiry(expiresAt);
  return <section aria-live="polite" className={`rounded-2xl border p-4 ${expired?"border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20":"border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"}`}>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-slate-950 dark:text-white">Claim reservation</p>
        <p className="mt-1 text-xs text-slate-500">Claim {claimId}</p>
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{expired?"Reservation expired. Refresh eligibility and reserve again before signing.":`Reserved for ${formatRemainingDuration(remainingMs)}.`}</p>
      </div>
      {onRefresh&&<button type="button" onClick={onRefresh} disabled={refreshing} className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold disabled:opacity-50 dark:border-slate-700">{refreshing?"Refreshing…":"Refresh claim"}</button>}
    </div>
  </section>;
}
