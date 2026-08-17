"use client";

import { useProviderDiagnostics } from "@/hooks/use-provider-diagnostics";
import { useProviderHealth } from "@/hooks/use-provider-health";
import { useProviderReadiness } from "@/hooks/use-provider-readiness";
import { useRoutePolicyDiagnostics } from "@/hooks/use-route-policy-diagnostics";
import { useSystemReadiness } from "@/hooks/use-system-readiness";

function StateBadge({ state }: { state: "ready" | "degraded" | "unavailable" | "checking" }) {
  const styles = state === "ready" ? "bg-[#f1f4f2] text-[#294a3b] ring-[#d4ddd8] dark:bg-[#09110e]/60 dark:text-[#d0dcd6] dark:ring-[#29483c]" : state === "degraded" ? "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-200 dark:ring-amber-900" : state === "unavailable" ? "bg-rose-50 text-rose-800 ring-rose-200 dark:bg-rose-950/30 dark:text-rose-200 dark:ring-rose-900" : "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800";
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ring-1 ring-inset ${styles}`}>{state}</span>;
}

export function OperationalStatusDashboard() {
  const health = useProviderHealth();
  const readiness = useProviderReadiness();
  const diagnostics = useProviderDiagnostics();
  const routePolicy = useRoutePolicyDiagnostics();
  const system = useSystemReadiness();
  const checking = health.loading || readiness.loading;
  const state = checking ? "checking" : readiness.ready && !health.degraded && !health.unavailable ? "ready" : health.unavailable || !health.online ? "unavailable" : "degraded";
  const providers = readiness.data?.providers ?? [];

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#294a3b] dark:text-[#d0dcd6]">Execution readiness</p><h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">PowerChain runtime status</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">New wallet actions remain fail-closed when provider evidence is stale, offline, unavailable, or lacks required redundancy. Existing operation history remains readable during provider incidents.</p></div>
          <div className="flex items-center gap-2"><StateBadge state={state}/><button type="button" disabled={health.refreshing||readiness.refreshing||diagnostics.refreshing||routePolicy.refreshing||system.refreshing} onClick={()=>void Promise.all([health.refresh(),readiness.refresh(),diagnostics.refresh(),routePolicy.refresh(),system.refresh()])} className="min-h-10 rounded-xl border border-slate-200 px-3.5 text-sm font-semibold disabled:opacity-50 dark:border-slate-700">{health.refreshing||readiness.refreshing||diagnostics.refreshing||routePolicy.refreshing||system.refreshing?"Refreshing…":"Refresh"}</button></div>
        </div>
        {!health.online ? <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">Browser is offline. Execution readiness is unavailable until connectivity returns.</p> : null}
        {health.error || readiness.error ? <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">{readiness.error ?? health.error}</p> : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950" aria-labelledby="system-readiness-title">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Production readiness</p><h2 id="system-readiness-title" className="mt-1 text-lg font-semibold">System execution envelope</h2><p className="mt-1 max-w-2xl text-sm text-slate-500">Aggregates database availability, provider execution readiness, worker heartbeats, queue attention and local route-policy pressure. It is a deployment/runtime gate, not balance or settlement evidence.</p></div>
          {system.data ? <StateBadge state={system.data.state === "ready" ? "ready" : system.data.state === "degraded" ? "degraded" : "unavailable"}/> : null}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"><p className="text-xs text-slate-500">New operations</p><p className="mt-1 text-lg font-semibold">{system.data ? system.data.capabilities.newOperations ? "Ready" : "Blocked" : "—"}</p></div>
          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"><p className="text-xs text-slate-500">Async settlement</p><p className="mt-1 text-lg font-semibold">{system.data ? system.data.capabilities.asyncSettlement ? "Ready" : "Blocked" : "—"}</p></div>
          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"><p className="text-xs text-slate-500">Maintenance control</p><p className="mt-1 text-lg font-semibold">{system.data ? !system.data.checks.maintenance.readHealthy ? "Fail-closed" : system.data.checks.maintenance.draining ? system.data.checks.maintenance.quiescent ? "Quiescent" : `Draining · ${system.data.checks.maintenance.activeLeases} leased` : "Off" : "—"}</p><p className="mt-1 text-xs text-slate-500">{system.data ? `r${system.data.checks.maintenance.revision} · ${system.data.checks.maintenance.source}` : "—"}</p></div>
          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"><p className="text-xs text-slate-500">Workers</p><p className="mt-1 text-lg font-semibold">{system.data ? `${system.data.checks.workers.readyCount} ready · ${system.data.checks.workers.observed}/${system.data.checks.workers.expected} seen` : "—"}</p></div>
          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"><p className="text-xs text-slate-500">Queue attention</p><p className="mt-1 text-lg font-semibold">{system.data?.checks.queues.attention ?? "—"}</p><p className="mt-1 text-xs capitalize text-slate-500">Backlog {system.data?.checks.queues.pressure ?? "—"}{system.data?.checks.queues.oldestPendingAgeMs != null ? ` · oldest ${Math.max(1, Math.round(system.data.checks.queues.oldestPendingAgeMs / 60000))}m` : ""}</p></div>
        </div>
        {system.data ? <><div className="mt-4 flex flex-wrap gap-2 text-[11px] text-slate-500"><span>{system.data.productionMode ? "Production mode" : "Non-production mode"}</span><span>·</span><span>Database {system.data.checks.database.ready ? "ready" : "blocked"}</span><span>·</span><span>Providers {system.data.checks.providers.ready ? system.data.checks.providers.degraded ? "degraded" : "ready" : "blocked"}</span><span>·</span><span>Limiter {system.data.checks.routePolicy.pressure}</span><span>·</span><span>Maintenance read {system.data.checks.maintenance.readHealthy ? "healthy" : "unavailable"}</span></div>{system.data.checks.workers.missing.length || system.data.checks.workers.stale.length ? <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">{system.data.checks.workers.missing.length ? <p>Missing workers: {system.data.checks.workers.missing.join(", ")}</p> : null}{system.data.checks.workers.stale.length ? <p>Stale workers: {system.data.checks.workers.stale.join(", ")}</p> : null}</div> : null}</> : null}
        {system.error ? <p className="mt-4 text-xs text-slate-500">System readiness unavailable: {system.error}</p> : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2" aria-label="Chain provider readiness">
        {providers.length ? providers.map((provider)=><article key={provider.provider} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{provider.provider}</p><h3 className="mt-1 text-lg font-semibold">Provider readiness</h3></div><StateBadge state={provider.ready ? provider.redundancy === "full" ? "ready" : "degraded" : "unavailable"}/></div><dl className="mt-5 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-slate-500">Redundancy</dt><dd className="mt-1 font-semibold capitalize">{provider.redundancy}</dd></div><div><dt className="text-slate-500">Latency</dt><dd className="mt-1 font-semibold">{provider.latencyMs === undefined ? "Unavailable" : `${provider.latencyMs} ms`}</dd></div><div><dt className="text-slate-500">Head</dt><dd className="mt-1 break-all font-mono text-xs">{provider.head ?? "Unavailable"}</dd></div><div><dt className="text-slate-500">Endpoints</dt><dd className="mt-1 font-semibold">{provider.configuredEndpoints ?? "Unavailable"}</dd></div></dl>{provider.error?<p className="mt-4 text-xs text-rose-700 dark:text-rose-300">{provider.error}</p>:null}</article>) : <div className="md:col-span-2 rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700">Provider readiness has not been verified yet.</div>}
      </section>


      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Request policy</p><h2 className="mt-1 text-lg font-semibold">Critical-route protection</h2><p className="mt-1 max-w-2xl text-sm text-slate-500">Process-local limiter occupancy and route-policy coverage. These diagnostics never contain client keys and are not billing, settlement, balance, or finality evidence.</p></div>{routePolicy.data?<StateBadge state={routePolicy.data.limiter.pressure === "normal" ? "ready" : routePolicy.data.limiter.pressure === "elevated" ? "degraded" : "unavailable"}/>:null}</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"><p className="text-xs text-slate-500">Registered critical routes</p><p className="mt-1 text-lg font-semibold">{routePolicy.data?.routes.registered ?? "—"}</p></div>
          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"><p className="text-xs text-slate-500">Limiter buckets</p><p className="mt-1 text-lg font-semibold">{routePolicy.data ? `${routePolicy.data.limiter.bucketCount} / ${routePolicy.data.limiter.maxBuckets}` : "—"}</p></div>
          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"><p className="text-xs text-slate-500">Limiter utilization</p><p className="mt-1 text-lg font-semibold">{routePolicy.data ? `${Math.round(routePolicy.data.limiter.utilization * 100)}%` : "—"}</p></div>
          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"><p className="text-xs text-slate-500">Strict routes</p><p className="mt-1 text-lg font-semibold">{routePolicy.data?.routes.rateClasses.strict ?? "—"}</p></div>
        </div>
        {routePolicy.data ? <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-slate-500"><span>Public read {routePolicy.data.routes.risks["public-read"]}</span><span>·</span><span>Wallet read {routePolicy.data.routes.risks["wallet-read"]}</span><span>·</span><span>Wallet write {routePolicy.data.routes.risks["wallet-write"]}</span><span>·</span><span>Operator {routePolicy.data.routes.risks.operator}</span></div> : null}
        {routePolicy.error ? <p className="mt-4 text-xs text-slate-500">Route policy diagnostics unavailable: {routePolicy.error}</p> : null}
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
        <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Process-local diagnostics</p><h2 className="mt-1 text-lg font-semibold">Provider telemetry</h2><p className="mt-1 text-sm text-slate-500">Operational counters are diagnostic only and are not authoritative for balances, rewards, settlement, or finality.</p></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{(["solana","sui"] as const).flatMap((chain)=>{const metrics=diagnostics.data?.chains[chain].metrics; return [{label:`${chain} requests`,value:metrics?.requests},{label:`${chain} failovers`,value:metrics?.failovers},{label:`${chain} rate limited`,value:metrics?.rateLimited},{label:`${chain} quorum conflicts`,value:metrics?.quorumDisagreements}]}).map((item)=><div key={item.label} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"><p className="text-xs text-slate-500">{item.label}</p><p className="mt-1 text-lg font-semibold">{item.value ?? "—"}</p></div>)}</div>
        {diagnostics.error ? <p className="mt-4 text-xs text-slate-500">Diagnostics unavailable: {diagnostics.error}</p> : null}
      </section>
    </div>
  );
}
