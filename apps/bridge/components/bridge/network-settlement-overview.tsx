"use client";

import { useProviderHealth } from "@/hooks/use-provider-health";
import { BrandLogo } from "@/components/navigation/brand-logo";
import { BRIDGE_DIRECTIONS } from "@/lib/data/data";

type Provider = NonNullable<ReturnType<typeof useProviderHealth>["data"]>["providers"][number];

function statusLabel(provider: Provider | undefined) {
  if (!provider) return "Checking";
  if (provider.status === "healthy") return "Healthy";
  if (provider.status === "degraded") return "Degraded";
  return "Unavailable";
}

function statusClasses(provider: Provider | undefined) {
  if (!provider) return "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300";
  if (provider.status === "healthy") return "border-[#d4ddd8] bg-[#f1f4f2] text-[#294a3b] dark:border-[#35584a]/25 dark:bg-[#29483c]/18 dark:text-[#d0dcd6]";
  if (provider.status === "degraded") return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200";
  return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300";
}

function ChainPanel({ name, network, provider, accent }: { name: string; network: string; provider: Provider | undefined; accent: "solana" | "sui" }) {
  const healthyEndpoints = provider?.endpoints?.filter((endpoint) => endpoint.healthy === true && endpoint.circuit === "closed").length ?? 0;
  const endpointTotal = provider?.endpoints?.length ?? 0;
  const fallbackLabel = healthyEndpoints >= 2 ? "Full" : healthyEndpoints === 1 ? "Reduced" : "Unavailable";
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-[#090d0b]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`grid size-11 place-items-center rounded-full border text-xs font-black ${accent === "solana" ? "border-slate-200 bg-slate-950 text-[#d0dcd6] dark:border-white/10 dark:bg-black" : "border-[#d4ddd8] bg-[#f1f4f2] text-[#294a3b] dark:border-[#35584a]/25 dark:bg-[#29483c]/18 dark:text-[#d0dcd6]"}`} aria-hidden="true">{accent === "solana" ? "SOL" : "SUI"}</span>
          <div><p className="text-lg font-semibold text-slate-950 dark:text-white">{name}</p><p className="text-xs text-slate-500">{network}</p></div>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClasses(provider)}`}><span className="size-1.5 rounded-full bg-current" />{statusLabel(provider)}</span>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div><dt className="text-xs text-slate-500">Finalized head</dt><dd className="mt-1 truncate font-mono text-xs font-semibold tabular-nums text-slate-800 dark:text-slate-200" title={provider?.head ?? "Unavailable"}>{provider?.head ?? "—"}</dd></div>
        <div><dt className="text-xs text-slate-500">RPC latency</dt><dd className="mt-1 font-semibold tabular-nums text-slate-800 dark:text-slate-200">{provider?.latencyMs != null ? `${provider.latencyMs} ms` : "—"}</dd></div>
        <div><dt className="text-xs text-slate-500">Transport</dt><dd className="mt-1 font-semibold text-slate-800 dark:text-slate-200">{provider?.source === "grpc" ? "gRPC" : "RPC"}</dd></div>
        <div><dt className="text-xs text-slate-500">Healthy endpoints</dt><dd className="mt-1 font-semibold tabular-nums text-slate-800 dark:text-slate-200">{endpointTotal ? `${healthyEndpoints}/${endpointTotal}` : "—"}</dd></div>
        <div><dt className="text-xs text-slate-500">Fallback readiness</dt><dd className={`mt-1 font-semibold ${healthyEndpoints >= 2 ? "text-[#294a3b] dark:text-[#d0dcd6]" : healthyEndpoints === 1 ? "text-amber-700 dark:text-amber-200" : "text-rose-700 dark:text-rose-300"}`}>{endpointTotal ? fallbackLabel : "—"}</dd></div>
      </dl>
      {provider?.endpoints?.length ? (
        <details className="mt-4 border-t border-slate-100 pt-3 text-xs dark:border-white/10">
          <summary className="cursor-pointer select-none font-semibold text-slate-600 outline-none hover:text-[#264b3b] focus-visible:ring-2 focus-visible:ring-[#35584a] dark:text-slate-300 dark:hover:text-[#d9e3de]">Endpoint diagnostics</summary>
          <ul className="mt-2 space-y-1.5" aria-label={`${name} endpoint diagnostics`}>
            {provider.endpoints.map((endpoint) => (
              <li key={endpoint.id ?? "endpoint"} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-2.5 py-2 dark:bg-white/[0.035]">
                <span className="truncate font-mono text-[11px] text-slate-600 dark:text-slate-300">{endpoint.id ?? "endpoint"}</span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${endpoint.healthy && endpoint.circuit === "closed" ? "bg-[#e1e8e4] text-[#294a3b] dark:bg-[#29483c]/18 dark:text-[#d0dcd6]" : endpoint.circuit === "half-open" ? "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200" : "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"}`}>{endpoint.healthy && endpoint.circuit === "closed" ? "Ready" : endpoint.circuit === "half-open" ? "Recovering" : "Unavailable"}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

export function NetworkSettlementOverview() {
  const { data, loading, refreshing, stale, online, refresh } = useProviderHealth();
  const solana = data?.providers.find((provider) => provider.provider === "solana");
  const sui = data?.providers.find((provider) => provider.provider === "sui");
  const operational = online && data?.status === "healthy" && !stale;
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-[#090d0b]" aria-labelledby="network-settlement-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#294a3b] dark:text-[#d0dcd6]">Networks & settlement</p>
          <h2 id="network-settlement-title" className="mt-1 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">Solana ↔ Sui infrastructure</h2>
          <p className="mt-1 text-sm text-slate-500">Live provider health for the configured PowerChain bridge endpoints.</p>
        </div>
        <button type="button" onClick={() => void refresh()} disabled={loading || refreshing || !online} className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-[#9eafa7] hover:text-[#264b3b] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-[#090d0b] dark:text-slate-200">{!online ? "Offline" : loading || refreshing ? "Checking…" : "Refresh networks"}</button>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <ChainPanel name="Solana" network="Mainnet Beta" provider={solana} accent="solana" />
        <div className="hidden flex-col items-center gap-2 lg:flex"><span className="h-px w-12 bg-[#c9d6d0] dark:bg-[#29483c]/30" /><span className="grid size-14 place-items-center rounded-2xl border border-[#d4ddd8] bg-[#f1f4f2] shadow-sm dark:border-[#35584a]/20 dark:bg-[#29483c]/18"><BrandLogo compact /></span><span className="h-px w-12 bg-[#c9d6d0] dark:bg-[#29483c]/30" /></div>
        <ChainPanel name="Sui" network="Mainnet" provider={sui} accent="sui" />
      </div>
      <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-4 dark:border-slate-800 dark:bg-[#070b09]">
        <Metric label="Bridge route" value={BRIDGE_DIRECTIONS.SUI_TO_SOLANA.shortLabel} />
        <Metric label="Principal" value="1:1" />
        <Metric label="Settlement" value="Wormhole NTT" />
        <Metric label="Runtime" value={!online ? "Offline" : operational ? "Operational" : data?.status === "unavailable" ? "Unavailable" : "Degraded"} good={operational} />
      </div>
      <p className="mt-3 text-[11px] leading-5 text-slate-500">No synthetic TPS, TVL, success-rate, or settlement claims are shown. Provider health and finalized heads come from the configured runtime endpoints; persisted reconciliation remains authoritative.</p>
    </section>
  );
}

function Metric({ label, value, good = false }: { label: string; value: string; good?: boolean }) {
  return <div className="rounded-xl bg-white px-3 py-2.5 dark:bg-[#090d0b]"><p className="text-[11px] text-slate-500">{label}</p><p className={`mt-1 text-sm font-semibold ${good ? "text-[#294a3b] dark:text-[#d0dcd6]" : "text-slate-900 dark:text-white"}`}>{value}</p></div>;
}
