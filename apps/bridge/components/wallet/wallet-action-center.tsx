"use client";

import Link from "next/link";
import { Button, buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { APP_ROUTES } from "@/config/app-routes";
import { DataQualityBanner } from "./data-quality-banner";

export type WalletActionCenterProps = {
  solanaConnected: boolean;
  suiConnected: boolean;
  claimStatus?: string | null;
  claimableLabel?: string | null;
  stale?: boolean;
  degraded?: boolean;
  runtimeReady?: boolean;
  online?: boolean;
  walletChanged?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
};

export function WalletActionCenter({
  solanaConnected,
  suiConnected,
  claimStatus,
  claimableLabel,
  stale = false,
  degraded = false,
  runtimeReady = true,
  online = true,
  walletChanged = false,
  refreshing = false,
  onRefresh,
}: WalletActionCenterProps) {
  const connected = solanaConnected || suiConnected;
  const actionBlocked = !online || stale || degraded || !runtimeReady || walletChanged;
  const canBridge = connected && !actionBlocked;
  const claimEligible = solanaConnected && claimStatus === "ELIGIBLE";
  const quality = !online ? "offline" : stale || walletChanged ? "stale" : degraded ? "degraded" : runtimeReady ? "fresh" : "unavailable";

  return (
    <Card as="section" className="p-4 sm:p-5" aria-labelledby="wallet-actions-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#294a3b] dark:text-[#adc0b6]">Next action</p>
          <h2 id="wallet-actions-title" className="mt-1 text-base font-semibold text-slate-950 dark:text-white">Bridge, claim or inspect activity</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">New signatures require a connected wallet and fresh runtime data. Existing status remains available during incidents.</p>
        </div>
        {onRefresh ? <Button size="sm" variant="secondary" disabled={!online} loading={refreshing} loadingLabel="Refreshing…" onClick={onRefresh}>{online ? "Refresh data" : "Offline"}</Button> : null}
      </div>

      <div className="mt-4">
        <DataQualityBanner quality={quality} {...(walletChanged ? { message: "Wallet identity changed. Refresh before bridge or claim." } : {})} onRefresh={onRefresh} refreshing={refreshing} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <ActionCard title="Bridge assets" detail="PWRC ↔ wPWRC · principal 1:1" href={APP_ROUTES.bridge} primary enabled={canBridge} {...(!connected ? { disabledReason: "Connect a wallet first" } : actionBlocked ? { disabledReason: "Refresh readiness first" } : {})} />
        <ActionCard title={claimEligible ? "Claim PWRC" : "Claim status"} detail={claimEligible ? `${claimableLabel || "Claimable PWRC"} available` : claimStatus || "Connect Solana to check"} href={APP_ROUTES.claim} enabled={solanaConnected} {...(!solanaConnected ? { disabledReason: "Connect Solana first" } : {})} />
        <ActionCard title="View history" detail="Solana + Sui wallet activity" href={APP_ROUTES.history} enabled={connected} {...(!connected ? { disabledReason: "Connect a wallet first" } : {})} />
      </div>
    </Card>
  );
}

function ActionCard({ title, detail, href, enabled, disabledReason, primary = false }: { title: string; detail: string; href: string; enabled: boolean; disabledReason?: string; primary?: boolean }) {
  if (!enabled) {
    return (
      <div aria-disabled="true" className="flex min-h-20 flex-col justify-center rounded-[var(--pc-radius-control)] border border-slate-200 bg-slate-50 px-4 py-3 text-slate-400 dark:border-slate-800 dark:bg-slate-900/40">
        <span className="font-semibold">{title}</span>
        <span className="mt-1 text-xs">{disabledReason || detail}</span>
      </div>
    );
  }
  return (
    <Link href={href} className={buttonClassName({ variant: primary ? "primary" : "secondary", className: "min-h-20 flex-col items-start px-4 py-3 text-left" })}>
      <span className="font-semibold">{title}</span>
      <span className={`mt-1 text-xs ${primary ? "text-[#edf2ef]" : "text-slate-500 dark:text-slate-400"}`}>{detail}</span>
    </Link>
  );
}
