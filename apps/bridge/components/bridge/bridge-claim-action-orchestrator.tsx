"use client";

import {useActionCoordinator} from "../../hooks/use-action-coordinator";

export function BridgeClaimActionOrchestrator({bridgeAllowed, claimAllowed, onBridge, onClaim}:{
  bridgeAllowed:boolean; claimAllowed:boolean; onBridge:()=>Promise<void>; onClaim:()=>Promise<void>;
}) {
  const actions = useActionCoordinator();
  const execute = async (kind:"bridge"|"claim") => {
    try { await actions.run(kind, kind === "bridge" ? onBridge : onClaim); }
    catch (error) { if (!(error instanceof Error && error.message.startsWith("ACTION_BUSY:"))) throw error; }
  };
  return <div className="grid gap-2 sm:grid-cols-2" aria-busy={actions.busy}>
    <button type="button" disabled={!bridgeAllowed || actions.busy} onClick={()=>void execute("bridge")} className="min-h-12 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950">{actions.activeAction === "bridge" ? "Preparing bridge…" : "Bridge PWRC"}</button>
    <button type="button" disabled={!claimAllowed || actions.busy} onClick={()=>void execute("claim")} className="min-h-12 rounded-xl border border-slate-300 px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700">{actions.activeAction === "claim" ? "Preparing claim…" : "Claim PWRC"}</button>
    <span className="sr-only" aria-live="polite">{actions.activeAction ? `${actions.activeAction} action in progress` : "Actions ready"}</span>
  </div>;
}
