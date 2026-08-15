"use client";

type Outcome="REJECTED"|"EXPIRED"|"FAILED"|"SUBMITTED"|"UNKNOWN";
type Props={outcome:Outcome;transferId?:string|null;onRefreshStatus?:()=>void;onRefreshQuote?:()=>void};

const COPY:{[K in Outcome]:{title:string;body:string}}={
  REJECTED:{title:"Wallet request cancelled",body:"No new transaction was authorized. You can review the latest quote before trying again."},
  EXPIRED:{title:"Quote expired",body:"Refresh the quote and review the updated fee, recipient and expiry before signing."},
  FAILED:{title:"Transaction failed",body:"Check the transaction details and current runtime state before attempting another submission."},
  SUBMITTED:{title:"Transaction submitted",body:"Track the existing transfer. Do not create another transfer for the same intent."},
  UNKNOWN:{title:"Submission outcome unknown",body:"Do not resubmit. Refresh transfer status or inspect the wallet/explorer first to determine whether a transaction was broadcast."},
};

export function TransactionRecoveryPanel({outcome,transferId,onRefreshStatus,onRefreshQuote}:Props){
  const copy=COPY[outcome];
  const attention=outcome==="UNKNOWN"||outcome==="FAILED";
  return <section role={attention?"alert":"status"} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
    <h3 className="font-semibold text-slate-950 dark:text-white">{copy.title}</h3>
    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{copy.body}</p>
    {transferId&&<p className="mt-2 break-all text-xs text-slate-500">Transfer {transferId}</p>}
    <div className="mt-4 flex flex-wrap gap-2">
      {onRefreshStatus&&<button type="button" onClick={onRefreshStatus} className="min-h-11 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">Check status</button>}
      {onRefreshQuote&&(outcome==="EXPIRED"||outcome==="REJECTED")&&<button type="button" onClick={onRefreshQuote} className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold dark:border-slate-700">Refresh quote</button>}
    </div>
  </section>;
}
