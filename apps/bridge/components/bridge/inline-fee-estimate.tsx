"use client";

import { CopyAddress } from "./copy-address";
import { useServiceFeePlan, type FeePlanChain } from "@/hooks/use-service-fee-plan";

const SCALE = 1_000_000_000n;
function formatBaseUnits(raw: string): string {
  const value = BigInt(raw || "0");
  const whole = value / SCALE;
  const fraction = (value % SCALE).toString().padStart(9, "0").replace(/0+$/, "");
  const grouped = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return fraction ? `${grouped}.${fraction}` : grouped;
}

export function InlineFeeEstimate({ routeId, sourceChain, principalBaseUnits, symbol = "PWRC", className = "" }: {
  routeId?: string | null;
  sourceChain?: FeePlanChain | null;
  principalBaseUnits?: bigint | null;
  symbol?: string;
  className?: string;
}) {
  const { plan, status, error, refresh } = useServiceFeePlan({ routeId, sourceChain, principalBaseUnits, enabled: Boolean(principalBaseUnits && principalBaseUnits > 0n) });
  return <section className={`rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-900/55 ${className}`} aria-label="Service fee estimate" aria-busy={status === "loading"}>
    <div className="flex items-center justify-between gap-3">
      <div><p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Service fee</p><p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Separate from the 1:1 bridge principal.</p></div>
      {status === "loading" ? <span className="text-xs font-semibold text-slate-500">Updating…</span> : plan ? <span className="text-sm font-semibold tabular-nums text-slate-950 dark:text-white">{formatBaseUnits(plan.feeBaseUnits)} {symbol}</span> : null}
    </div>
    {plan ? <div className="mt-3 grid gap-2 sm:grid-cols-2"><div className="rounded-xl bg-white px-3 py-2.5 dark:bg-slate-950"><p className="text-[11px] text-slate-500">Total source token debit</p><p className="mt-0.5 text-sm font-semibold tabular-nums text-slate-950 dark:text-white">{formatBaseUnits(plan.totalSourceDebitBaseUnits)} {symbol}</p></div><div className="rounded-xl bg-white px-3 py-2.5 dark:bg-slate-950"><p className="text-[11px] text-slate-500">Governed recipient</p><div className="mt-1"><CopyAddress value={plan.recipient} label="service fee wallet" /></div></div></div> : null}
    {error ? <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"><span>Fee estimate unavailable. Do not sign until a current quote is loaded.</span><button type="button" onClick={() => void refresh()} className="shrink-0 font-bold underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a]">Retry</button></div> : null}
  </section>;
}
