"use client";

import {useReviewFreshness, type ReviewIdentity} from "../../hooks/use-review-freshness";
import {formatRemainingDuration} from "../../lib/ui/duration-format";

type Props={current:ReviewIdentity|null;reviewed:ReviewIdentity|null;onReviewAgain?:()=>void};

export function ReviewFreshnessAlert({current,reviewed,onReviewAgain}:Props){
  const state=useReviewFreshness(current,reviewed);
  if(state.valid)return <p className="text-xs text-slate-500" aria-live="polite">Review valid for {formatRemainingDuration(state.expiresInMs)}.</p>;
  const message=state.expired?"Quote or reservation expired.":state.changed?"The quote or reservation changed after this review.":"Review is not current.";
  return <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100">
    <p className="font-semibold">Review required again</p>
    <p className="mt-1">{message} Confirming remains disabled until you review the latest values.</p>
    {onReviewAgain&&<button type="button" onClick={onReviewAgain} className="mt-3 min-h-11 rounded-lg border border-amber-400 px-3 font-semibold dark:border-amber-800">Review latest</button>}
  </div>;
}
