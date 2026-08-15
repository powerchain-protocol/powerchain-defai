import { WalletActionCenter } from "./wallet-action-center";
import { CrossChainActivityList } from "./cross-chain-activity-list";
"use client";

import { WalletActionCenter } from "@/components/wallet/wallet-action-center";
import { WalletIdentityNotice } from "@/components/wallet/wallet-identity-notice";
import { CrossChainActivityList } from "@/components/wallet/cross-chain-activity-list";

import Link from "next/link";
import { useWalletPortfolio } from "@/hooks/use-wallet-portfolio";
import { useWalletActivityFeed } from "@/hooks/use-wallet-activity-feed";
import { useClaimEligibility } from "@/hooks/use-claim-eligibility";
import type { WalletActivityItem, WalletActivityPage } from "@/lib/types/wallet-api";

const DECIMALS = 9;
function amount(value: unknown) {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return "0";
  const padded = value.padStart(DECIMALS + 1, "0");
  const whole = padded.slice(0, -DECIMALS).replace(/^0+(?=\d)/, "") || "0";
  const fraction = padded.slice(-DECIMALS).replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole;
}
function short(value?: string | null) { return value && value.length > 14 ? `${value.slice(0,6)}…${value.slice(-6)}` : value || "—"; }
function pill(status: string) {
  if (status === "ELIGIBLE" || status === "COMPLETED" || status === "FINALIZED") return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200";
  if (status === "ALREADY_CLAIMED") return "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300";
  if (status === "NOT_ELIGIBLE" || status === "FAILED") return "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-200";
  return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200";
}

export function WalletOverviewShell({ solanaAddress, suiAddress }: { solanaAddress?: string | null; suiAddress?: string | null }) {
  const portfolio = useWalletPortfolio(solanaAddress, suiAddress);
  const eligibility = useClaimEligibility(solanaAddress || undefined);
  const activity = useWalletActivityFeed(solanaAddress, suiAddress, 20);
  const balances = portfolio.data?.balances;
  const stale = Boolean(portfolio.data?.freshness?.solanaStale || portfolio.data?.freshness?.suiStale);
  const degraded = portfolio.data?.status === "degraded" || activity.pages.some((page: WalletActivityPage) => page?.status === "degraded");
  const claimStatus = eligibility.data?.status || (solanaAddress ? "CHECKING" : "CONNECT SOLANA");

  return <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8" aria-labelledby="wallet-title">
    <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">PowerChain Wallet</p><h1 id="wallet-title" className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">PWRC & wPWRC</h1><p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">Balances, claim readiness and cross-chain activity from Solana and Sui. Bridge accounting remains based on persisted finality and reconciliation evidence.</p></div>
      <div className="flex flex-wrap gap-2"><Link href="/bridge" className="min-h-10 rounded-xl bg-[#0B1730] px-4 py-2.5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">Bridge assets</Link><Link href="/assets" className="min-h-10 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:text-slate-100">View assets</Link></div>
    </header>

    {!solanaAddress && !suiAddress ? <EmptyWallet /> : null}
    {portfolio.error ? <Notice tone="danger" title="Wallet data unavailable" body={portfolio.error} action={() => void portfolio.refresh()} /> : null}
    {stale ? <Notice tone="warning" title="Balance data may be stale" body="Refresh wallet data before using the displayed balance for a new bridge or claim action." action={() => void portfolio.refresh()} /> : null}
    {degraded ? <Notice tone="warning" title="Partial chain data" body="One provider is degraded. Available chain data is still shown; retry before making a new action." action={() => void Promise.all([portfolio.refresh(), activity.refresh()])} /> : null}
    <WalletIdentityNotice solanaAddress={solanaAddress} suiAddress={suiAddress} onRefresh={() => void Promise.all([portfolio.refresh(), eligibility.refresh(), activity.refresh()])} />
    <div className="mt-5"><WalletActionCenter solanaConnected={Boolean(solanaAddress)} suiConnected={Boolean(suiAddress)} claimStatus={claimStatus} claimableLabel={`${amount(eligibility.data?.claimableBaseUnits)} PWRC`} stale={stale} degraded={degraded} refreshing={portfolio.loading || activity.loading} onRefresh={() => void Promise.all([portfolio.refresh(), eligibility.refresh(), activity.refresh()])} /></div>

    <section className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="Wallet balances">
      <BalanceCard chain="Solana" asset="PWRC" value={amount(balances?.solanaPwrcBaseUnits)} address={solanaAddress} stale={Boolean(portfolio.data?.freshness?.solanaStale)} />
      <BalanceCard chain="Sui" asset="wPWRC" value={amount(balances?.suiWpwrcBaseUnits)} address={suiAddress} stale={Boolean(portfolio.data?.freshness?.suiStale)} />
      <Metric label="Principal equivalent" value={`${amount(balances?.principalEquivalentBaseUnits)} PWRC`} hint="Wallet-level 1:1 equivalent" />
      <Metric label="Claimable" value={`${amount(eligibility.data?.claimableBaseUnits)} PWRC`} hint={claimStatus} badgeClass={pill(claimStatus)} />
    </section>

    <section className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-start justify-between gap-4"><div><h2 className="font-semibold">PWRC ↔ wPWRC bridge</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Canonical PWRC on Solana and its 1:1 bridged representation on Sui.</p></div><span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">Wormhole NTT</span></div>
        <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3"><AssetNode chain="Solana" symbol="PWRC" kind="Native" /><div className="flex size-10 items-center justify-center rounded-full border border-slate-200 text-lg dark:border-slate-700" aria-label="1 to 1 bridge">↔</div><AssetNode chain="Sui" symbol="wPWRC" kind="Bridged" /></div>
        <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-300"><strong>Principal rule:</strong> 1 PWRC = 1 wPWRC. Service fee and network gas are separate from destination principal.</div>
        <div className="mt-4 flex flex-wrap gap-2"><Link href="/bridge" className="rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">Open bridge</Link><Link href="/fees" className="rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-semibold dark:border-slate-700">View fees</Link></div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold">Claim readiness</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Eligibility is checked by the server for your connected Solana wallet.</p></div><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${pill(claimStatus)}`}>{claimStatus}</span></div>
        <dl className="mt-5 space-y-3 text-sm"><Row label="Wallet" value={short(solanaAddress)} mono /><Row label="Claimable" value={`${amount(eligibility.data?.claimableBaseUnits)} PWRC`} /><Row label="Status" value={claimStatus} /></dl>
        <div className="mt-5 flex flex-wrap gap-2"><Link href="/claim" className={`rounded-lg px-3.5 py-2 text-sm font-semibold ${claimStatus === "ELIGIBLE" ? "bg-[#0B1730] text-white" : "border border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200"}`}>{claimStatus === "ELIGIBLE" ? "Start claim" : "View claim"}</Link><button type="button" onClick={() => void eligibility.refresh()} className="rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-semibold dark:border-slate-700">Recheck</button></div>
      </div>
    </section>

    <div className="mt-5"><CrossChainActivityList activity={activity.activity} loading={activity.loading} error={activity.error} hasNextPage={activity.hasNextPage} onLoadMore={() => void activity.loadMore()} onRefresh={() => void activity.refresh()} /></div>
  </main>;
}

function EmptyWallet() { return <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-900/40"><h2 className="text-sm font-semibold">Connect a wallet to load on-chain data</h2><p className="mx-auto mt-1 max-w-lg text-sm text-slate-500">Connect Solana for PWRC and claim eligibility, Sui for wPWRC, or both for the complete cross-chain view.</p></div>; }
function BalanceCard({chain,asset,value,address,stale}:{chain:string;asset:string;value:string;address?:string|null;stale:boolean}) { return <article className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{chain}</span>{stale?<span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-200">Stale</span>:<span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200">Finalized</span>}</div><div className="mt-3 text-xl font-semibold tabular-nums">{value} <span className="text-sm text-slate-500">{asset}</span></div><div className="mt-2 truncate font-mono text-xs text-slate-500" title={address || undefined}>{short(address)}</div></article>; }
function Metric({label,value,hint,badgeClass}:{label:string;value:string;hint:string;badgeClass?:string}) { return <article className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div><div className="mt-3 truncate text-xl font-semibold tabular-nums" title={value}>{value}</div>{badgeClass?<span className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${badgeClass}`}>{hint}</span>:<p className="mt-2 text-xs text-slate-500">{hint}</p>}</article>; }
function AssetNode({chain,symbol,kind}:{chain:string;symbol:string;kind:string}) { return <div className="rounded-xl border border-slate-200 p-3 text-center dark:border-slate-700"><div className="text-xs text-slate-500">{chain}</div><div className="mt-1 font-semibold">{symbol}</div><div className="mt-1 text-[11px] font-medium text-blue-600">{kind}</div></div>; }
function Row({label,value,mono=false}:{label:string;value:string;mono?:boolean}) { return <div className="flex items-center justify-between gap-4"><dt className="text-slate-500">{label}</dt><dd className={`${mono?"font-mono text-xs":"font-semibold tabular-nums"} truncate`} title={value}>{value}</dd></div>; }
function ActivityRow({row}:{row: WalletActivityItem}) { const chain=String(row?.chain||"UNKNOWN").toUpperCase(); const title=row?.label||row?.description||row?.type||"Transaction"; const id=row?.signature||row?.digest||row?.id||""; const href=row?.explorerUrl||row?.url; return <div className="grid gap-2 px-4 py-3 sm:grid-cols-[90px_1fr_auto] sm:items-center"><div><span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-300">{chain}</span></div><div className="min-w-0"><div className="truncate text-sm font-medium">{title}</div><div className="mt-0.5 truncate font-mono text-xs text-slate-500">{short(id)}</div></div>{href?<a href={href} target="_blank" rel="noreferrer" className="justify-self-start text-xs font-semibold text-blue-600 hover:underline sm:justify-self-end">Explorer ↗</a>:null}</div>; }
function Notice({tone,title,body,action}:{tone:"warning"|"danger";title:string;body:string;action:()=>void}) { const cls=tone==="danger"?"border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-200":"border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200"; return <div role={tone==="danger"?"alert":"status"} className={`mt-4 flex flex-col gap-3 rounded-xl border p-3 text-sm sm:flex-row sm:items-center sm:justify-between ${cls}`}><div><strong>{title}</strong><span className="ml-1">{body}</span></div><button type="button" onClick={action} className="min-h-9 shrink-0 rounded-lg border border-current/20 px-3 text-xs font-semibold">Retry</button></div>; }
