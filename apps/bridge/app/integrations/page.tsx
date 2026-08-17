import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { integrations } from "../../config/integrations";
import { OperationalReadinessCard } from "@/components/operations/operational-readiness-card";
import { CrossChainFoundationCard } from "@/components/integrations/cross-chain-foundation-card";
import { ProviderDiagnosticsCard } from "@/components/integrations/provider-diagnostics-card";
import { ApplicationSuiteCard } from "@/components/integrations/application-suite-card";
import { CloudflareEdgeCard } from "@/components/integrations/cloudflare-edge-card";

export const metadata: Metadata = {
  title: "Integrations",
  description: "Configured application, protocol, market-data, execution, storage, and edge-runtime integrations used by PowerChain DeFAI.",
};

const categoryLabel = {
  bridge: "Bridge",
  liquidity: "Liquidity",
  "market-data": "Market data",
  storage: "Storage",
  edge: "Infrastructure",
} as const;

export default function IntegrationsPage() {
  const enabledCount = integrations.filter((integration) => integration.enabled).length;

  return (
    <main className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
      <PageHeader
        eyebrow="PowerChain DeFAI"
        title="Applications and integrations"
        description="A single view of product surfaces, cross-chain infrastructure, liquidity providers and the production edge runtime. Wormhole NTT is the only cross-chain principal movement protocol; runtime availability remains configuration- and health-gated."
      />

      <ApplicationSuiteCard />
      <CloudflareEdgeCard />

      <section className="grid gap-4 xl:grid-cols-2" aria-label="Operational integration readiness">
        <CrossChainFoundationCard />
        <OperationalReadinessCard />
      </section>
      <ProviderDiagnosticsCard />

      <section aria-labelledby="provider-catalog-title" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#294a3b] dark:text-[#adc0b6]">Provider catalog</p>
            <h2 id="provider-catalog-title" className="mt-1 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">Configured runtime providers</h2>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-500 dark:text-slate-400" aria-label="Integration summary">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-800 dark:bg-slate-950">{integrations.length} configured</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-800 dark:bg-slate-950">{enabledCount} enabled</span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Integration providers">
          {integrations.map((integration) => (
            <article key={integration.id} className="pc-panel group rounded-2xl p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(7,16,13,.10)] dark:hover:shadow-[0_22px_54px_rgba(0,0,0,.34)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">{categoryLabel[integration.category]}</p>
                  <h3 className="mt-1 truncate font-semibold text-slate-950 dark:text-white">{integration.name}</h3>
                  <p className="mt-1 text-xs capitalize text-slate-500 dark:text-slate-400">{integration.domain.replace("-", " ")}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${integration.enabled ? "bg-[#f1f4f2] text-[#294a3b] ring-[#d4ddd8] dark:bg-[#09110e]/60 dark:text-[#d0dcd6] dark:ring-[#29483c]" : "bg-slate-100 text-slate-500 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-800"}`}>
                  {integration.enabled ? "Enabled" : "Off"}
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">{integration.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
