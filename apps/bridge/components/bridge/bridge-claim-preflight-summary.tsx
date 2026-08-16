"use client";

type Check = { label: string; ok: boolean; detail?: string };

export function BridgeClaimPreflightSummary({ walletConnected, walletDataFresh, runtimeReady, assetIntegrityHealthy, claimEligible }: { walletConnected: boolean; walletDataFresh: boolean; runtimeReady: boolean; assetIntegrityHealthy: boolean; claimEligible?: boolean | null }) {
  const bridgeChecks: Check[] = [
    { label: "Wallet connected", ok: walletConnected },
    { label: "Wallet data fresh", ok: walletDataFresh },
    { label: "Bridge runtime ready", ok: runtimeReady },
    { label: "PWRC / wPWRC integrity", ok: assetIntegrityHealthy },
  ];
  const bridgeReady = bridgeChecks.every((check) => check.ok);
  return <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950" aria-labelledby="bridge-claim-preflight-title"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#294a3b]">Preflight</p><h2 id="bridge-claim-preflight-title" className="mt-1 font-semibold">Bridge & claim readiness</h2></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${bridgeReady?"bg-[#f1f4f2] text-[#294a3b] dark:bg-[#09110e]/50 dark:text-[#d0dcd6]":"bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200"}`}>{bridgeReady?"Bridge ready":"Action required"}</span></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{bridgeChecks.map((check)=><div key={check.label} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm dark:bg-slate-900"><span aria-hidden="true" className={check.ok?"text-[#35584a]":"text-amber-600"}>{check.ok?"✓":"!"}</span><span>{check.label}</span></div>)}</div><div className="mt-4 border-t border-slate-200 pt-3 text-sm dark:border-slate-800"><strong>Claim:</strong> {claimEligible === true ? "Eligible — authorization still requires the server challenge and claim reservation." : claimEligible === false ? "Not currently eligible." : "Eligibility is checked by the server."}</div><p className="mt-2 text-xs text-slate-500">Readiness controls new actions only. Existing transfer/claim status remains available for recovery.</p></section>;
}
