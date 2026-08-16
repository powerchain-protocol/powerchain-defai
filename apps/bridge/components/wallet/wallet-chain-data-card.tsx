"use client";
import { useMemo } from "react";
import type { WalletHistoryItem } from "@/lib/types/wallet-api";
import { useWalletChainData } from "@/hooks/use-wallet-chain-data";
import { useClaimEligibility } from "@/hooks/use-claim-eligibility";

function short(value: string, left = 6, right = 6) { return value.length <= left + right + 3 ? value : `${value.slice(0, left)}…${value.slice(-right)}`; }
function utc(seconds: number | null | undefined) { return seconds ? new Date(seconds * 1000).toISOString().replace("T", " ").replace(".000Z", " UTC") : "—"; }

export function WalletChainDataCard({ solanaAddress, suiAddress }: { solanaAddress?: string | null; suiAddress?: string | null }) {
  const solana = useWalletChainData("SOLANA", solanaAddress);
  const sui = useWalletChainData("SUI", suiAddress);
  const eligibility = useClaimEligibility(solanaAddress || undefined);
  const claimable = useMemo(() => {
    const raw = eligibility.data?.claimableBaseUnits;
    if (!raw || !/^\d+$/.test(raw)) return "0";
    const value = raw.padStart(10, "0");
    const whole = value.slice(0, -9).replace(/^0+(?=\d)/, "");
    const frac = value.slice(-9).replace(/0+$/, "");
    return frac ? `${whole}.${frac}` : whole;
  }, [eligibility.data?.claimableBaseUnits]);

  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950" aria-labelledby="wallet-chain-data-title">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 id="wallet-chain-data-title" className="text-base font-semibold">Wallet & on-chain activity</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Finalized balances, claim eligibility and recent chain activity. Explorer/indexer data is informational; bridge accounting remains reconciliation-owned.</p></div><div className="flex gap-2"><button type="button" className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm font-semibold dark:border-slate-700" onClick={() => void Promise.all([solana.refresh(), sui.refresh(), eligibility.refresh()])}>Refresh</button></div></div>

    <div className="mt-5 grid gap-4 lg:grid-cols-2">
      <ChainPanel title="Solana · PWRC" address={solanaAddress} state={solana} claimStatus={eligibility.data?.status} claimable={claimable} />
      <ChainPanel title="Sui · wPWRC" address={suiAddress} state={sui} />
    </div>
  </section>;
}

function ChainPanel({ title, address, state, claimStatus, claimable }: { title: string; address?: string | null; state: ReturnType<typeof useWalletChainData>; claimStatus?: string; claimable?: string }) {
  const data = state.data;
  const balance = data?.balance?.balance ?? "0";
  const native = data?.chain === "SOLANA" ? `${data?.balance?.nativeBalanceSol ?? "0"} SOL` : `${data?.balance?.nativeBalanceSui ?? "0"} SUI`;
  const rows = Array.isArray(data?.history?.transactions) ? data.history.transactions : [];
  return <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
    <div className="flex items-start justify-between gap-3"><div><div className="text-sm font-semibold">{title}</div><div className="mt-1 font-mono text-xs text-slate-500" title={address || undefined}>{address ? short(address) : "Wallet not connected"}</div></div>{data?.explorer?.account ? <a className="text-xs font-semibold text-[#294a3b] hover:underline" target="_blank" rel="noreferrer" href={data.explorer.account}>Explorer</a> : null}</div>
    <div className="mt-4 grid grid-cols-2 gap-3"><Metric label="PWRC balance" value={state.loading ? "Loading…" : balance} /><Metric label="Native gas" value={state.loading ? "Loading…" : native} />{claimStatus ? <Metric label="Claim eligibility" value={claimStatus} /> : null}{claimable !== undefined ? <Metric label="Claimable" value={`${claimable} PWRC`} /> : null}</div>
    {state.error ? <div role="alert" className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">{state.error}</div> : null}
    <div className="mt-4"><div className="mb-2 flex items-center justify-between"><div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recent transactions</div><div className="text-xs text-slate-500">{data?.history?.source || "—"}</div></div>{rows.length ? <div className="divide-y divide-slate-100 dark:divide-slate-900">{rows.slice(0, 8).map((row: WalletHistoryItem) => { const id = row.signature || row.digest; return <a key={id} href={row.explorerUrl} target="_blank" rel="noreferrer" className="flex min-h-12 items-center justify-between gap-3 py-2 text-sm hover:text-[#264b3b]"><div className="min-w-0"><div className="truncate font-mono text-xs">{short(id, 8, 8)}</div><div className="mt-1 text-xs text-slate-500">{row.type || row.status || "Transaction"}</div></div><div className="shrink-0 text-right text-xs text-slate-500">{utc(row.timestamp)}</div></a>; })}</div> : <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500 dark:bg-slate-900">{address ? (state.loading ? "Loading history…" : "No recent transactions found.") : "Connect this wallet to load history."}</div>}</div>
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900"><div className="text-xs text-slate-500">{label}</div><div className="mt-1 truncate text-sm font-semibold tabular-nums" title={value}>{value}</div></div>; }
