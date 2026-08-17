"use client";

import { CryptoAssetIcon } from "@/components/assets/crypto-asset-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardIcon, CardTitle } from "@/components/ui/card";
import { useClaimEligibility } from "@/hooks/use-claim-eligibility";
import { canStartClaim } from "@/lib/claim/claim-contract";
import { baseUnitsToDecimalString } from "@/lib/bridge/base-units";

const PWRC_ASSET = { symbol: "PWRC", name: "PowerChain", chain: "SOLANA" } as const;

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
  const actionLabel = busy ? "Preparing claim…" : eligible ? "Claim PWRC" : data?.status === "ALREADY_CLAIMED" || data?.status === "FINALIZED" ? "Already claimed" : "Not claimable";

  return (
    <Card aria-labelledby="claim-title">
      <CardHeader className="flex-col gap-4 sm:flex-row">
        <div className="flex min-w-0 items-start gap-3">
          <CardIcon className="size-11 bg-white p-1.5 dark:bg-white/[.05]"><CryptoAssetIcon token={PWRC_ASSET} size={30}/></CardIcon>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#557568]">Solana · Token-2022</p>
            <CardTitle id="claim-title" className="mt-1 text-lg">Claim PWRC</CardTitle>
            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">Eligibility is verified server-side for the connected wallet. Browser state never creates claim authority.</p>
          </div>
        </div>
        <span className="rounded-full border border-[#d6e2dc] bg-[#eef3f0] px-3 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-[#294a3b] dark:border-[#284338] dark:bg-[#173b2d]/35 dark:text-[#d0dcd6]">Wallet approved</span>
      </CardHeader>
      <CardContent className="space-y-4">
        {!connected ? (
          <div className="rounded-[var(--pc-radius-control)] border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/8 dark:bg-white/[.035]">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Connect the eligible Solana wallet to continue.</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Connection identifies the signing wallet; the claim service still validates trusted-wallet eligibility and reservation state.</p>
            <Button variant="primary" className="mt-4" onClick={onConnect}>Connect wallet</Button>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center rounded-[var(--pc-radius-control)] border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/8 dark:bg-white/[.035]">
              <div><p className="text-[10px] font-bold uppercase tracking-[.13em] text-slate-500">Claimable balance</p><p className="mt-1 text-3xl font-semibold tracking-[-.04em] tabular-nums text-slate-950 dark:text-white">{loading ? "Checking…" : `${amount} PWRC`}</p><p className="mt-2 truncate font-mono text-[11px] text-slate-500" title={walletAddress ?? undefined}>{walletAddress}</p></div>
              <div className="hidden sm:block"><CryptoAssetIcon token={PWRC_ASSET} size={52}/></div>
            </div>
            {error ? <div role="alert" className="rounded-[14px] border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">{error}</div> : null}
            {data?.reason ? <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">{data.reason}</p> : null}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="primary" className="flex-1" onClick={() => data && void onBeginClaim(data)} disabled={!eligible || loading || busy}>{actionLabel}</Button>
              <Button onClick={() => void refresh()} disabled={loading || busy}>Refresh eligibility</Button>
            </div>
            <p className="text-xs leading-5 text-slate-500">Claims follow the server challenge → reservation → submission → finalization flow. For an unknown submission outcome, check the persisted claim ID before attempting any retry.</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
