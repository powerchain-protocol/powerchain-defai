import { ActiveTransferBanner } from "@/components/bridge/active-transfer-banner";
import { BridgeAssetSummary } from "@/components/bridge/bridge-asset-summary";
import { BridgeRuntimeGate } from "@/components/bridge/bridge-runtime-gate";
import { LiveChainDataCard } from "@/components/bridge/live-chain-data-card";
import { ProviderStatusStrip } from "@/components/bridge/provider-status-strip";
import { WormholeNttPanel } from "@/components/bridge/wormhole-ntt-panel";
import { PageHeader } from "@/components/ui/page-header";

export default function BridgePage() {
  return (
    <main className="mx-auto max-w-6xl space-y-5">
      <PageHeader
        eyebrow="PowerChain Bridge™"
        title="Bridge PWRC ↔ wPWRC"
        description="Wallet-signed Wormhole NTT transfers between Solana and Sui. Principal remains 1:1; service fee and network gas are separate."
      />
      <ProviderStatusStrip />
      <ActiveTransferBanner />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,.75fr)]">
        <WormholeNttPanel />
        <aside className="space-y-4" aria-label="Bridge route and network context">
          <BridgeAssetSummary />
          <BridgeRuntimeGate />
          <LiveChainDataCard />
        </aside>
      </div>
      <p className="rounded-xl border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-500 dark:border-slate-800 dark:bg-slate-950">
        Bridge execution is enabled only by the configured NTT deployment. The application never invents manager, transceiver, mint or Sui coin identifiers. Persisted finality and reconciliation—not widget or explorer state—remain authoritative for completion.
      </p>
    </main>
  );
}
