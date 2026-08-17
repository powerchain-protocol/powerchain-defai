"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Button, buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InlineAlert } from "@/components/ui/inline-alert";
import { APP_ROUTES } from "@/config/app-routes";
import { useClaimEligibility } from "@/hooks/use-claim-eligibility";
import { usePwrcTransfers } from "@/hooks/use-pwrc-transfers";
import { useWalletPortfolio } from "@/hooks/use-wallet-portfolio";

const DECIMALS = 9;

function decimal(value: unknown) {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return "0";
  const padded = value.padStart(DECIMALS + 1, "0");
  const whole = padded.slice(0, -DECIMALS).replace(/^0+(?=\d)/, "") || "0";
  const fraction = padded.slice(-DECIMALS).replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole;
}

function short(value?: string | null) {
  return value && value.length > 14 ? `${value.slice(0, 6)}…${value.slice(-6)}` : value || "—";
}

export function WalletPortfolioCard({ solanaAddress, suiAddress }: { solanaAddress?: string | null; suiAddress?: string | null }) {
  const portfolio = useWalletPortfolio(solanaAddress, suiAddress);
  const eligibility = useClaimEligibility(solanaAddress || undefined);
  const transfers = usePwrcTransfers(solanaAddress || undefined, 5);
  const balances = portfolio.data?.balances;
  const total = useMemo(() => decimal(balances?.principalEquivalentBaseUnits), [balances?.principalEquivalentBaseUnits]);
  const claimable = useMemo(() => decimal(eligibility.data?.claimableBaseUnits), [eligibility.data?.claimableBaseUnits]);
  const stale = Boolean(portfolio.data?.freshness?.solanaStale || portfolio.data?.freshness?.suiStale);
  const degraded = portfolio.data?.status === "degraded";
  const refreshing = portfolio.loading || eligibility.loading || transfers.loading;

  async function refreshAll() {
    await Promise.allSettled([portfolio.refresh(), eligibility.refresh(), transfers.refresh()]);
  }

  return (
    <Card as="section" className="overflow-hidden" aria-labelledby="wallet-portfolio-title">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-5 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#294a3b] dark:text-[#adc0b6]">Cross-chain wallet</p>
          <h2 id="wallet-portfolio-title" className="mt-1 text-lg font-semibold">PWRC & wPWRC</h2>
          <p className="mt-1 max-w-xl text-sm text-slate-600 dark:text-slate-400">Finalized wallet balances, claim readiness and recent PWRC activity across Solana and Sui.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={APP_ROUTES.bridge} className={buttonClassName({ variant: "primary", size: "sm" })}>Bridge</Link>
          <Button size="sm" variant="secondary" onClick={() => void refreshAll()} loading={refreshing} loadingLabel="Refreshing…">Refresh</Button>
        </div>
      </div>

      <div className="space-y-3 px-5 pt-4">
        {portfolio.error ? <InlineAlert tone="danger" title="Wallet portfolio unavailable">Provider data is temporarily unavailable. Refresh when Runtime Status is healthy.</InlineAlert> : null}
        {stale ? <InlineAlert tone="warning" title="Balance observations are stale">Refresh before starting a new bridge or claim action.</InlineAlert> : null}
        {degraded ? <InlineAlert tone="warning" title="Partial provider degradation">Available finalized chain data is still shown, but verify freshness before acting.</InlineAlert> : null}
      </div>

      <div className="mt-4 grid gap-px bg-slate-200 dark:bg-slate-800 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="PWRC · Solana" value={`${decimal(balances?.solanaPwrcBaseUnits)} PWRC`} hint={short(solanaAddress)} />
        <Metric label="wPWRC · Sui" value={`${decimal(balances?.suiWpwrcBaseUnits)} wPWRC`} hint={short(suiAddress)} />
        <Metric label="Principal equivalent" value={`${total} PWRC`} hint="Wallet-level 1:1 equivalent" />
        <Metric label="Claimable" value={`${claimable} PWRC`} hint={eligibility.data?.status || (solanaAddress ? "Checking eligibility" : "Connect Solana")} />
      </div>

      <div className="grid gap-4 p-5 lg:grid-cols-[.9fr_1.1fr]">
        <div className="rounded-[var(--pc-radius-card)] border border-slate-200 p-4 dark:border-slate-800">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">PWRC ↔ wPWRC</div>
              <div className="text-xs text-slate-500">Wormhole NTT · 1 PWRC ↔ 1 wPWRC principal</div>
            </div>
            <Link href={APP_ROUTES.assets} className="text-xs font-semibold text-[#294a3b] dark:text-[#adc0b6]">Assets</Link>
          </div>
          <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <Node chain="Solana" asset="PWRC" kind="Native" />
            <span className="text-center text-slate-400" aria-hidden="true">↔</span>
            <Node chain="Sui" asset="wPWRC" kind="Bridged" />
          </div>
          <p className="mt-3 text-xs text-slate-500">Service fee and network gas are separate from destination principal.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={APP_ROUTES.bridge} className={buttonClassName({ variant: "primary", size: "sm" })}>Bridge assets</Link>
            <Link href={APP_ROUTES.fees} className={buttonClassName({ variant: "secondary", size: "sm" })}>Fees</Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-[var(--pc-radius-card)] border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <div>
              <div className="text-sm font-semibold">Recent PWRC transfers</div>
              <div className="text-xs text-slate-500">Finalized indexed transfer data when configured.</div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => void transfers.refresh()} loading={transfers.loading} loadingLabel="Refreshing…">Refresh</Button>
          </div>
          {transfers.error ? (
            <div className="p-4 text-sm text-slate-500">Finalized transfer history is temporarily unavailable.</div>
          ) : transfers.data?.transfers?.length ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-900">
              {transfers.data.transfers.slice(0, 5).map((row) => (
                <a key={row.signature} href={row.explorerUrl} target="_blank" rel="noopener noreferrer" className="grid grid-cols-[58px_1fr_auto] gap-2 px-4 py-3 text-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#35584a] dark:hover:bg-slate-900">
                  <span className="text-[11px] font-semibold uppercase text-slate-500">{row.direction}</span>
                  <span className="truncate font-mono text-xs">{short(row.signature)}</span>
                  <span className="tabular-nums">{decimal(row.amountBaseUnits)} PWRC</span>
                </a>
              ))}
            </div>
          ) : (
            <div className="p-5 text-center text-sm text-slate-500">{transfers.loading ? "Loading finalized transfers…" : "No recent PWRC transfers found."}</div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 sm:flex-row sm:items-center sm:justify-between">
        <span>Claim eligibility is server-authoritative.</span>
        <span>Wallet/indexer data is not bridge accounting evidence. Accounting authority: reconciliation.</span>
      </div>
    </Card>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return <div className="bg-white p-4 dark:bg-slate-950"><div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div><div className="mt-2 truncate text-lg font-semibold tabular-nums" title={value}>{value}</div><div className="mt-1 truncate text-xs text-slate-500" title={hint}>{hint}</div></div>;
}

function Node({ chain, asset, kind }: { chain: string; asset: string; kind: string }) {
  return <div className="rounded-[var(--pc-radius-control)] bg-slate-50 p-3 text-center dark:bg-slate-900"><div className="text-xs text-slate-500">{chain}</div><div className="font-semibold">{asset}</div><div className="text-[11px] text-[#294a3b] dark:text-[#adc0b6]">{kind}</div></div>;
}
