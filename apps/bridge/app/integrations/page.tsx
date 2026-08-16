import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { integrations } from "../../config/integrations";
import { OperationalReadinessCard } from "@/components/operations/operational-readiness-card";
import { CrossChainFoundationCard } from "@/components/integrations/cross-chain-foundation-card";

export const metadata: Metadata = {
  title: "Integrations",
  description: "Configured protocol, market-data, execution, storage, and operational integrations used by PowerChain DeFAI.",
};

export default function IntegrationsPage() {
  const enabledCount = integrations.filter((integration) => integration.enabled).length;

  return (
    <main className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        eyebrow="PowerChain DeFAI"
        title="Protocol and data integrations"
        description="Wormhole NTT is the only cross-chain principal movement protocol. Liquidity, storage, and market-data integrations remain optional supporting providers."
      />
      <CrossChainFoundationCard />
      <OperationalReadinessCard />
      <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-500 dark:text-slate-400" aria-label="Integration summary">
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-800 dark:bg-slate-950">{integrations.length} configured</span>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-800 dark:bg-slate-950">{enabledCount} enabled</span>
      </div>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Integration providers">
        {integrations.map((integration) => (
          <article key={integration.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-950 dark:text-white">{integration.name}</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{integration.chain}</p>
              </div>
              <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${integration.enabled ? "bg-[#f1f4f2] text-[#294a3b] ring-[#d4ddd8] dark:bg-[#09110e]/60 dark:text-[#d0dcd6] dark:ring-[#29483c]" : "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800"}`}>
                {integration.enabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {integration.enabled ? "Available to the configured runtime when its required credentials and network settings are valid." : "Unavailable until the required production configuration is supplied and verified."}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
