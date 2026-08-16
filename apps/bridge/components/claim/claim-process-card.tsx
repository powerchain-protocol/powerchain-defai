"use client";

import { useClaimEligibility } from "@/hooks/use-claim-eligibility";
import { canStartClaim } from "@/lib/claim/claim-contract";
import { baseUnitsToDecimalString } from "@/lib/bridge/base-units";

type Props = {
  walletAddress?: string | null;
  connected: boolean;
  busy?: boolean;
  onConnect: () => void;
  onBeginClaim: (eligibility: NonNullable<ReturnType<typeof useClaimEligibility>["data"]>) => Promise<void> | void;
};

export function ClaimProcessCard({ walletAddress, connected, busy = false, onConnect, onBeginClaim }: Props) {
  const { data, loading, error, refresh } = useClaimEligibility(walletAddress);
  const eligible = Boolean(data && canStartClaim(data));
  const amount = data ? baseUnitsToDecimalString(BigInt(data.claimableBaseUnits), 9) : "0";
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950" aria-labelledby="claim-title">
      <div className="flex items-start justify-between gap-4"><div><h2 id="claim-title" className="text-base font-semibold">Claim PWRC</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Eligibility is verified by the server for the connected trusted wallet. Client state never grants claim authority.</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium dark:bg-slate-900">Solana · PWRC</span></div>
      {!connected ? <div className="mt-5 rounded-xl border border-slate-200 p-4 dark:border-slate-800"><p className="text-sm">Connect the eligible Solana wallet to continue.</p><button type="button" onClick={onConnect} className="mt-3 min-h-11 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">Connect wallet</button></div> : null}
      {connected ? <div className="mt-5 space-y-4"><div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900"><div className="text-xs font-medium uppercase tracking-wide text-slate-500">Claimable</div><div className="mt-1 text-2xl font-semibold tabular-nums">{loading ? "Checking…" : `${amount} PWRC`}</div><div className="mt-1 truncate font-mono text-xs text-slate-500" title={walletAddress ?? undefined}>{walletAddress}</div></div>{error ? <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">{error}</div> : null}{data?.reason ? <p className="text-sm text-slate-600 dark:text-slate-400">{data.reason}</p> : null}<div className="flex flex-col gap-2 sm:flex-row"><button type="button" onClick={() => data && void onBeginClaim(data)} disabled={!eligible || loading || busy} className="min-h-11 flex-1 rounded-xl bg-[#173b2d] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Preparing claim…" : eligible ? "Claim PWRC" : data?.status === "ALREADY_CLAIMED" || data?.status === "FINALIZED" ? "Already claimed" : "Not claimable"}</button><button type="button" onClick={() => void refresh()} disabled={loading || busy} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold disabled:opacity-50 dark:border-slate-700">Refresh</button></div><p className="text-xs leading-5 text-slate-500">Claims must follow the server challenge → reservation → submission → finalization flow. An unknown submission outcome should be checked by claim status before retrying.</p></div> : null}
    </section>
  );
}
