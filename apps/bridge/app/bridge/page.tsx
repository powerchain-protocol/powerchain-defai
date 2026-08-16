import { ActiveTransferBanner } from "@/components/bridge/active-transfer-banner";
import { BridgeAssetSummary } from "@/components/bridge/bridge-asset-summary";
import { BridgeRuntimeGate } from "@/components/bridge/bridge-runtime-gate";
import { BridgeMetricsCard } from "@/components/bridge/bridge-metrics-card";
import { BridgeTrustStrip } from "@/components/bridge/bridge-trust-strip";
import { LiveChainDataCard } from "@/components/bridge/live-chain-data-card";
import { NetworkSettlementOverview } from "@/components/bridge/network-settlement-overview";
import { ProviderStatusStrip } from "@/components/bridge/provider-status-strip";
import { RecentTransfersCard } from "@/components/bridge/recent-transfers-card";
import { TradeWorkspace } from "@/components/trade/trade-workspace";

export default function BridgePage() {
  return (
    <main className="mx-auto max-w-[1280px] space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#294a3b] dark:text-[#d0dcd6]">PowerChain Bridge™</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl dark:text-white">Bridge wPWRC → PWRC</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">Default route: Sui wPWRC → Solana PWRC through wallet-signed Wormhole NTT. Reverse routing remains available when the configured deployment supports it.</p>
        </div>
        <div className="hidden sm:block"><ProviderStatusStrip /></div>
      </div>
      <div className="sm:hidden"><ProviderStatusStrip /></div>
      <ActiveTransferBanner />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,.62fr)]">
        <TradeWorkspace defaultTab="bridge" />
        <aside className="space-y-4" aria-label="Bridge route and network context">
          <BridgeAssetSummary />
          <BridgeRuntimeGate />
          <LiveChainDataCard />
        </aside>
      </div>
      <BridgeTrustStrip />
      <NetworkSettlementOverview />
      <BridgeMetricsCard />
      <RecentTransfersCard />
      <p className="rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-500 dark:border-slate-800 dark:bg-slate-950">
        Bridge execution is enabled only by the configured NTT deployment. The application never invents manager, transceiver, mint or Sui coin identifiers. Persisted finality and reconciliation—not widget or explorer state—remain authoritative for completion.
      </p>
    </main>
  );
}
