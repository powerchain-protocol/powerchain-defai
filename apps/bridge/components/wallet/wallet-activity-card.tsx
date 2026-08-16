"use client";

import { useMemo } from "react";
import { useWalletOverview } from "@/hooks/use-wallet-overview";
import { useClaimEligibility } from "@/hooks/use-claim-eligibility";
import type { WalletActivityItem } from "@/lib/types/wallet-api";

function short(value: string, left = 7, right = 7) {
  return value.length <= left + right + 3 ? value : `${value.slice(0, left)}…${value.slice(-right)}`;
}

function utc(seconds: number | null | undefined) {
  return seconds ? new Date(seconds * 1000).toISOString().replace("T", " ").replace(".000Z", " UTC") : "—";
}

function baseUnitsToPwrc(value: unknown) {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return "0";
  const padded = value.padStart(10, "0");
  const whole = padded.slice(0, -9).replace(/^0+(?=\d)/, "") || "0";
  const fraction = padded.slice(-9).replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole;
}

export function WalletActivityCard({ solanaAddress, suiAddress }: { solanaAddress?: string | null; suiAddress?: string | null }) {
  const overview = useWalletOverview(solanaAddress, suiAddress);
  const eligibility = useClaimEligibility(solanaAddress || undefined);
  const activity = Array.isArray(overview.data?.activity) ? overview.data.activity : [];
  const claimable = useMemo(() => baseUnitsToPwrc(eligibility.data?.claimableBaseUnits), [eligibility.data?.claimableBaseUnits]);
  const degraded = overview.data?.status === "degraded";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950" aria-labelledby="wallet-activity-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="wallet-activity-title" className="text-base font-semibold">Cross-chain wallet activity</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Finalized balances and recent Solana/Sui activity. Indexer and explorer data is informational; bridge accounting remains reconciliation-owned.</p>
        </div>
        <button type="button" className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] dark:border-slate-700" onClick={() => void Promise.all([overview.refresh(), eligibility.refresh()])} disabled={overview.loading}>
          {overview.loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {degraded ? <div role="status" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">One chain data source is unavailable. Available chain data remains visible; do not infer bridge accounting state from this card.</div> : null}
      {overview.error ? <div role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-200">{overview.error}</div> : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="PWRC on Solana" value={overview.data?.solana?.balance?.balance ?? (solanaAddress ? "—" : "Not connected")} />
        <Metric label="wPWRC on Sui" value={overview.data?.sui?.balance?.balance ?? (suiAddress ? "—" : "Not connected")} />
        <Metric label="Claim eligibility" value={eligibility.data?.status || (solanaAddress ? "Checking…" : "Connect Solana")} />
        <Metric label="Claimable" value={`${claimable} PWRC`} />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col gap-1 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div className="text-sm font-semibold">Recent activity</div>
          <div className="text-xs text-slate-500">Solana: {overview.data?.solana?.history?.source || "—"} · Sui: {overview.data?.sui?.history?.source || "—"}</div>
        </div>
        {activity.length ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-900">
            {activity.slice(0, 20).map((row: WalletActivityItem) => (
              <a key={`${row.chain}:${row.id}`} href={row.explorerUrl || undefined} target={row.explorerUrl ? "_blank" : undefined} rel={row.explorerUrl ? "noreferrer" : undefined} className="grid min-h-14 grid-cols-[auto_1fr] gap-3 px-4 py-3 text-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#35584a] sm:grid-cols-[72px_1fr_auto] dark:hover:bg-slate-900/60">
                <div className="text-xs font-semibold text-slate-500">{row.chain}</div>
                <div className="min-w-0"><div className="truncate font-medium">{row.label}</div><div className="mt-1 truncate font-mono text-xs text-slate-500">{short(row.id)}</div></div>
                <div className="col-start-2 text-xs text-slate-500 sm:col-start-auto sm:text-right"><div>{row.status || "—"}</div><div className="mt-1 tabular-nums">{utc(row.timestamp)}</div></div>
              </a>
            ))}
          </div>
        ) : (
          <div className="p-4 text-sm text-slate-500">{solanaAddress || suiAddress ? (overview.loading ? "Loading activity…" : "No recent activity found.") : "Connect a Solana or Sui wallet to load activity."}</div>
        )}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900"><div className="text-xs text-slate-500">{label}</div><div className="mt-1 truncate text-sm font-semibold tabular-nums" title={value}>{value}</div></div>;
}
