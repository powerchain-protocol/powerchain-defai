"use client";

import { NetworkIcon } from "@web3icons/react/dynamic";
import { useProviderRuntime } from "@/context/provider-runtime-context";
import type { ProviderHealthPayload } from "@/types/providers";
import { BrandLogo } from "@/components/navigation/brand-logo";
import { BRIDGE_DIRECTIONS } from "@/lib/data/data";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Provider = ProviderHealthPayload["providers"][number];

function statusLabel(provider: Provider | undefined) {
  if (!provider) return "Checking";
  if (provider.status === "healthy") return "Healthy";
  if (provider.status === "degraded") return "Degraded";
  return "Unavailable";
}

function statusTone(provider: Provider | undefined): BadgeTone {
  if (!provider) return "neutral";
  if (provider.status === "healthy") return "success";
  if (provider.status === "degraded") return "warning";
  return "danger";
}

function ChainPanel({ name, network, provider, networkKey }: { name: string; network: string; provider: Provider | undefined; networkKey: "solana" | "sui" }) {
  const healthyEndpoints = provider?.endpoints?.filter((endpoint) => endpoint.healthy === true && endpoint.circuit === "closed").length ?? 0;
  const endpointTotal = provider?.endpoints?.length ?? 0;
  const fallbackLabel = healthyEndpoints >= 2 ? "Full" : healthyEndpoints === 1 ? "Reduced" : "Unavailable";
  return (
    <Card className="min-w-0 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-[var(--pc-radius-control)] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[.04]" aria-hidden="true">
            <NetworkIcon network={networkKey} size={28} variant="branded" />
          </span>
          <div><p className="text-lg font-semibold text-slate-950 dark:text-white">{name}</p><p className="text-xs text-slate-500">{network}</p></div>
        </div>
        <Badge tone={statusTone(provider)}>{statusLabel(provider)}</Badge>
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
          <summary className="cursor-pointer select-none font-semibold text-slate-600 outline-none hover:text-[#264b3b] focus-visible:ring-2 focus-visible:ring-[#557568] dark:text-slate-300 dark:hover:text-[#d9e3de]">Endpoint diagnostics</summary>
          <ul className="mt-2 space-y-1.5" aria-label={`${name} endpoint diagnostics`}>
            {provider.endpoints.map((endpoint) => {
              const tone: BadgeTone = endpoint.healthy && endpoint.circuit === "closed" ? "success" : endpoint.circuit === "half-open" ? "warning" : "danger";
              return (
                <li key={endpoint.id ?? "endpoint"} className="flex items-center justify-between gap-3 rounded-[var(--pc-radius-control)] bg-slate-50 px-2.5 py-2 dark:bg-white/[0.035]">
                  <span className="truncate font-mono text-[11px] text-slate-600 dark:text-slate-300">{endpoint.id ?? "endpoint"}</span>
                  <Badge tone={tone}>{endpoint.healthy && endpoint.circuit === "closed" ? "Ready" : endpoint.circuit === "half-open" ? "Recovering" : "Unavailable"}</Badge>
                </li>
              );
            })}
          </ul>
        </details>
      ) : null}
    </Card>
  );
}

export function NetworkSettlementOverview() {
  const { health: { data, loading, refreshing, stale, online, refresh } } = useProviderRuntime();
  const solana = data?.providers.find((provider) => provider.provider === "solana");
  const sui = data?.providers.find((provider) => provider.provider === "sui");
  const operational = online && data?.status === "healthy" && !stale;
  return (
    <Card className="p-4 sm:p-6" aria-labelledby="network-settlement-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#294a3b] dark:text-[#d0dcd6]">Networks & settlement</p>
          <h2 id="network-settlement-title" className="mt-1 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">Solana ↔ Sui infrastructure</h2>
          <p className="mt-1 text-sm text-slate-500">Live provider health for the configured PowerChain bridge endpoints.</p>
        </div>
        <Button size="sm" onClick={() => void refresh()} disabled={!online} loading={loading || refreshing} loadingLabel="Checking…">{online ? "Refresh networks" : "Offline"}</Button>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <ChainPanel name="Solana" network="Mainnet Beta" provider={solana} networkKey="solana" />
        <div className="hidden flex-col items-center gap-2 lg:flex"><span className="h-px w-12 bg-[#c9d6d0] dark:bg-[#29483c]/30" /><span className="grid size-14 place-items-center rounded-[var(--pc-radius-card)] border border-[#d4ddd8] bg-[#f1f4f2] shadow-sm dark:border-[#35584a]/20 dark:bg-[#29483c]/18"><BrandLogo compact /></span><span className="h-px w-12 bg-[#c9d6d0] dark:bg-[#29483c]/30" /></div>
        <ChainPanel name="Sui" network="Mainnet" provider={sui} networkKey="sui" />
      </div>
      <div className="mt-4 grid gap-3 rounded-[var(--pc-radius-card)] border border-slate-200 bg-slate-50 p-3 sm:grid-cols-4 dark:border-slate-800 dark:bg-[#070b09]">
        <Metric label="Bridge route" value={BRIDGE_DIRECTIONS.SUI_TO_SOLANA.shortLabel} />
        <Metric label="Principal" value="1:1" />
        <Metric label="Settlement" value="Wormhole NTT" />
        <Metric label="Runtime" value={!online ? "Offline" : operational ? "Operational" : data?.status === "unavailable" ? "Unavailable" : "Degraded"} good={operational} />
      </div>
      <p className="mt-3 text-[11px] leading-5 text-slate-500">No synthetic TPS, TVL, success-rate, or settlement claims are shown. Provider health and finalized heads come from the configured runtime endpoints; persisted reconciliation remains authoritative.</p>
    </Card>
  );
}

function Metric({ label, value, good = false }: { label: string; value: string; good?: boolean }) {
  return <div className="rounded-[var(--pc-radius-control)] bg-white px-3 py-2.5 dark:bg-[#090d0b]"><p className="text-[11px] text-slate-500">{label}</p><p className={`mt-1 text-sm font-semibold ${good ? "text-[#294a3b] dark:text-[#d0dcd6]" : "text-slate-900 dark:text-white"}`}>{value}</p></div>;
}
