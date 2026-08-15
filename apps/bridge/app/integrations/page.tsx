import { integrations } from "../../config/integrations";

export default function IntegrationsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Integrations</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">Wormhole NTT is the only cross-chain principal movement protocol. DEX and storage integrations are optional route/data providers.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => (
          <article key={integration.id} className="rounded-2xl border p-5">
            <div className="font-semibold">{integration.name}</div>
            <div className="mt-1 text-sm text-slate-500">{integration.chain}</div>
            <div className="mt-4 text-sm">{integration.enabled ? "Enabled" : "Disabled until configured"}</div>
          </article>
        ))}
      </div>
    </main>
  );
}
