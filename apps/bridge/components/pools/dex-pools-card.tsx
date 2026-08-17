"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useLiquidity } from "@/hooks/use-liquidity";
import { usePools } from "@/hooks/use-pools";
import type { PoolProvider } from "@/lib/data/pools";
import { useConnectedWallets } from "@/lib/wallet/connected-wallets";

const PROVIDERS: readonly ["all" | PoolProvider, string][] = [
  ["all", "All DEXs"],
  ["raydium", "Raydium"],
  ["meteora", "Meteora"],
  ["orca", "Orca"],
  ["cetus", "Cetus"],
];

function money(value: number | null) {
  if (value == null) return "—";
  return Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function short(value: string) {
  return value.length > 18 ? `${value.slice(0, 7)}…${value.slice(-5)}` : value || "—";
}

export function DexPoolsCard() {
  const [provider, setProvider] = useState<"all" | PoolProvider>("all");
  const wallets = useConnectedWallets();
  const liquidity = useLiquidity(wallets.solanaAddress);
  const pools = usePools({ provider: provider === "all" ? undefined : provider });
  const visible = pools.data?.pools.slice(0, 12) ?? [];
  const raydiumPositions = (liquidity.data?.providers.raydium.stakePositions ?? 0) + (liquidity.data?.providers.raydium.lockedPositions ?? 0);
  const meteoraPositions = liquidity.data?.providers.meteora.openPositions ?? 0;

  return (
    <Card className="overflow-hidden" aria-labelledby="dex-pools-title">
      <CardHeader className="flex-col sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#35584a] dark:text-[#adc0b6]">Liquidity routing</p>
          <CardTitle id="dex-pools-title" className="mt-1 text-lg">Trusted DEX pools</CardTitle>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500 dark:text-slate-400">Live discovery only. Pool metrics are routing context and never establish bridge settlement finality.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <label className="sr-only" htmlFor="dex-provider-filter">Filter pools by provider</label>
          <Select id="dex-provider-filter" value={provider} onChange={(event) => setProvider(event.target.value as "all" | PoolProvider)} className="w-full sm:min-w-40">
            {PROVIDERS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </Select>
          <Button size="md" onClick={() => void pools.refresh()} loading={pools.loading} loadingLabel="Checking…">Refresh pools</Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2 border-t border-slate-200/80 pt-4 text-[10px] text-slate-500 dark:border-white/8 dark:text-slate-400" aria-live="polite">
          {wallets.solanaAddress ? (
            <>
              <Badge tone="neutral" className="normal-case tracking-normal">Raydium LP {liquidity.loading ? "…" : raydiumPositions}</Badge>
              <Badge tone="neutral" className="normal-case tracking-normal">Meteora LP {liquidity.loading ? "…" : meteoraPositions}</Badge>
            </>
          ) : <span>Connect a Solana wallet to load LP positions.</span>}
        </div>
      </CardContent>

      <div className="divide-y divide-slate-200/70 border-t border-slate-200/80 dark:divide-white/8 dark:border-white/8">
        {visible.map((pool) => (
          <div key={`${pool.provider}:${pool.id}`} className="grid gap-3 bg-white px-4 py-4 transition hover:bg-slate-50/80 dark:bg-[#0a100d] dark:hover:bg-white/[.025] sm:grid-cols-[1.2fr_.65fr_.65fr_auto] sm:items-center sm:px-5">
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <Badge className="shrink-0">{pool.provider}</Badge>
                <strong className="truncate text-sm text-slate-950 dark:text-white">{pool.name}</strong>
              </div>
              <p className="mt-1 truncate font-mono text-[10px] text-slate-400" title={pool.id}>{short(pool.id)}</p>
            </div>
            <PoolMetric label="TVL" value={money(pool.tvlUsd)} />
            <PoolMetric label="24h volume" value={money(pool.volume24hUsd)} />
            <Badge tone="success" className="w-fit">{pool.chain}</Badge>
          </div>
        ))}
        {!visible.length ? (
          <div className="bg-white p-5 text-sm text-slate-500 dark:bg-[#0a100d] dark:text-slate-400" role="status">
            {pools.loading ? "Discovering trusted pools…" : pools.error ? "Pool discovery is temporarily unavailable. Refresh to try again." : "No trusted pools were returned for this provider."}
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function PoolMetric({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-200">{value}</p></div>;
}
