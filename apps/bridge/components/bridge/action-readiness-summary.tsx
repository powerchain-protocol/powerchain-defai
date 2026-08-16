"use client";

type Check={label:string;ready:boolean;detail?:string};
export function ActionReadinessSummary({online,walletReady,dataFresh,runtimeReady,assetIntegrityReady,noActiveMutation}:{online:boolean;walletReady:boolean;dataFresh:boolean;runtimeReady:boolean;assetIntegrityReady:boolean;noActiveMutation:boolean}) {
  const checks:Check[]=[
    {label:"Internet connection",ready:online},
    {label:"Wallet session",ready:walletReady},
    {label:"Wallet data fresh",ready:dataFresh},
    {label:"Bridge runtime",ready:runtimeReady},
    {label:"PWRC / wPWRC integrity",ready:assetIntegrityReady},
    {label:"No other mutation in progress",ready:noActiveMutation,...(!noActiveMutation?{detail:"Open the existing operation instead of starting another."}: {})},
  ];
  const ready=checks.every(x=>x.ready);
  return <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
    <div className="flex items-center justify-between gap-3"><h2 className="text-sm font-semibold">Action readiness</h2><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ready?"bg-[#f1f4f2] text-[#294a3b] dark:bg-[#09110e] dark:text-[#d0dcd6]":"bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"}`}>{ready?"Ready":"Attention"}</span></div>
    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
      {checks.map(check=><li key={check.label} className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800"><div className="flex items-center gap-2"><span aria-hidden="true">{check.ready?"✓":"!"}</span><span className="font-medium">{check.label}</span></div>{check.detail?<p className="mt-1 text-xs text-slate-500">{check.detail}</p>:null}</li>)}
    </ul>
    <p className="mt-3 text-xs text-slate-500">A ready browser state does not authorize a claim or bridge transfer. Server runtime, eligibility, reservation, quote and finality checks remain authoritative.</p>
  </section>;
}
