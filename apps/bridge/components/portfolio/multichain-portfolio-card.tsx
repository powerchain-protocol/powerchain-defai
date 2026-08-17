"use client";

import { useConnectedWallets } from "@/lib/wallet/connected-wallets";
import { usePortfolio } from "@/hooks/use-portfolio";
import { formatTokenAmount } from "@/lib/tokens/trusted-token-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineAlert } from "@/components/ui/inline-alert";

export function MultichainPortfolioCard() {
  const wallets = useConnectedWallets();
  const portfolio = usePortfolio(wallets.solanaAddress, wallets.suiAddress);
  const connected = Boolean(wallets.solanaAddress || wallets.suiAddress);

  return (
    <Card className="overflow-hidden" aria-labelledby="portfolio-title">
      <CardHeader className="items-center border-b border-slate-200/70 dark:border-white/8">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Portfolio</p>
          <h2 id="portfolio-title" className="mt-1 text-base font-semibold text-slate-950 dark:text-white">Trusted assets</h2>
        </div>
        <Button size="sm" onClick={() => void portfolio.refresh()} disabled={!portfolio.online || !connected} loading={portfolio.loading || portfolio.refreshing} loadingLabel="Refreshing…">{portfolio.online ? "Refresh" : "Offline"}</Button>
      </CardHeader>

      {!connected ? (
        <CardContent className="pt-5"><EmptyState title="Connect a wallet" description="Connect a Solana or Sui wallet to load trusted-asset balances." /></CardContent>
      ) : portfolio.loading && !portfolio.data ? (
        <CardContent className="grid gap-3 pt-5 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-live="polite">
          {[0, 1, 2].map((key) => <div key={key} className="h-24 animate-pulse rounded-[var(--pc-radius-control)] bg-slate-100 motion-reduce:animate-none dark:bg-white/[.05]" />)}
          <span className="sr-only">Loading trusted asset balances…</span>
        </CardContent>
      ) : portfolio.data?.balances.length ? (
        <div className="grid gap-px bg-slate-200/70 dark:bg-white/8 sm:grid-cols-2 lg:grid-cols-3">
          {portfolio.data.balances.map((balance) => (
            <div key={balance.tokenId} className="bg-white p-4 dark:bg-[#080d0b]">
              <div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{balance.chain}</span><Badge tone="success">Trusted</Badge></div>
              <p className="mt-3 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">{formatTokenAmount(balance.balanceBaseUnits, balance.decimals)} <span className="text-sm text-slate-500">{balance.symbol}</span></p>
            </div>
          ))}
        </div>
      ) : (
        <CardContent className="pt-5"><EmptyState title="No trusted balances found" description="The connected wallets do not currently expose a configured trusted asset balance." /></CardContent>
      )}

      {portfolio.error ? (
        <CardContent className="pt-4">
          <InlineAlert title={portfolio.error === "PORTFOLIO_OFFLINE" ? "Portfolio refresh paused offline" : "Portfolio data unavailable"} tone="warning">
            {portfolio.data ? "Showing the last successful balance snapshot. Refresh after provider connectivity recovers." : "Balance data could not be verified. No balance is inferred from this failure."}
          </InlineAlert>
        </CardContent>
      ) : portfolio.stale ? (
        <CardContent className="pt-4"><InlineAlert title="Portfolio snapshot is stale" tone="warning">Refresh balances before starting a new bridge, swap, or claim action.</InlineAlert></CardContent>
      ) : null}
    </Card>
  );
}
