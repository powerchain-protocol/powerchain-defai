"use client";

import { useStatus } from "@/hooks/use-status";
import { StatusOverview } from "./status-overview";
import { StatusServiceCard } from "./status-service-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserSettings } from "@/context/user-settings-context";
import { formatPercent } from "@/utils/helpers";

// useStatus consolidates useSystemReadiness, provider readiness and route-policy diagnostics into one operator view.
export function OperationalStatusDashboard() {
  const { settings } = useUserSettings();
  const status = useStatus(settings.operations.statusRefreshMs);
  const system = status.system.data;
  const routePolicy = status.routePolicy.data;
  const diagnostics = status.diagnostics.data;

  return <div className="space-y-4 sm:space-y-5">
    <StatusOverview summary={status.summary} refreshing={status.refreshing} onRefresh={() => void status.refresh()}/>

    {status.errors.length ? <aside role="status" className="rounded-[var(--pc-radius-control)] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/25 dark:text-amber-200"><strong>Some operational evidence is unavailable.</strong><span className="ml-1">New actions continue to fail closed where required.</span><details className="mt-2"><summary className="cursor-pointer text-xs font-semibold">Show diagnostics ({status.errors.length})</summary><ul className="mt-2 space-y-1 font-mono text-[11px] leading-5">{status.errors.slice(0, 5).map((message) => <li key={message} className="break-words">{message}</li>)}</ul></details></aside> : null}

    <section className="grid auto-rows-fr gap-3 sm:gap-4 md:grid-cols-2 2xl:grid-cols-3" aria-label="Runtime services">
      {status.services.map((service) => <StatusServiceCard key={service.id} service={service}/>) }
    </section>

    <section className="grid gap-4 xl:grid-cols-2" aria-label="Runtime policy and execution envelope">
      <Card className="h-full" aria-labelledby="system-readiness-title">
        <CardHeader><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#557568]">Production readiness</p><CardTitle id="system-readiness-title" className="mt-1 text-lg">System execution envelope</CardTitle><p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">Readiness combines persistence, provider redundancy, workers, queue pressure and maintenance state. It is operational evidence only and is not authoritative for balances or settlement.</p></div></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Metric label="New operations" value={system ? system.capabilities.newOperations ? "Ready" : "Blocked" : "—"}/>
          <Metric label="Async settlement" value={system ? system.capabilities.asyncSettlement ? "Ready" : "Blocked" : "—"}/>
          <Metric label="Queue attention" value={system ? String(system.checks.queues.attention) : "—"}/>
          <Metric label="Workers" value={system ? `${system.checks.workers.readyCount}/${system.checks.workers.expected} ready` : "—"}/>
        </CardContent>
      </Card>

      <Card className="h-full" aria-labelledby="route-policy-title">
        <CardHeader><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#557568]">Request policy</p><CardTitle id="route-policy-title" className="mt-1 text-lg">Critical-route protection</CardTitle><p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">Process-local limiter occupancy and route coverage are sanitized diagnostics, never accounting or settlement evidence.</p></div></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Metric label="Registered critical routes" value={routePolicy ? String(routePolicy.routes.registered) : "—"}/>
          <Metric label="Limiter buckets" value={routePolicy ? `${routePolicy.limiter.bucketCount}/${routePolicy.limiter.maxBuckets}` : "—"}/>
          <Metric label="Limiter utilization" value={routePolicy ? formatPercent(routePolicy.limiter.utilization) : "—"}/>
          <Metric label="Strict routes" value={routePolicy ? String(routePolicy.routes.rateClasses.strict) : "—"}/>
        </CardContent>
      </Card>
    </section>

    {settings.operations.showProcessTelemetry ? <Card aria-labelledby="provider-telemetry-title">
      <CardHeader><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#557568]">Process-local diagnostics</p><CardTitle id="provider-telemetry-title" className="mt-1 text-lg">Provider telemetry</CardTitle><p className="mt-1 text-sm leading-6 text-slate-500">Counters help operators diagnose reliability and failover. They do not prove balances, rewards, settlement, or finality.</p></div></CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{(["solana", "sui"] as const).flatMap((chain) => { const metrics = diagnostics?.chains[chain].metrics; return [{ label: `${chain} requests`, value: metrics?.requests }, { label: `${chain} failovers`, value: metrics?.failovers }, { label: `${chain} rate limited`, value: metrics?.rateLimited }, { label: `${chain} quorum conflicts`, value: metrics?.quorumDisagreements }]; }).map((item) => <Metric key={item.label} label={item.label} value={item.value === undefined ? "—" : String(item.value)}/>)}</CardContent>
    </Card> : null}
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[var(--pc-radius-control)] border border-slate-200/80 bg-slate-50/80 p-3 dark:border-white/8 dark:bg-white/[.035]"><p className="text-[10px] font-semibold uppercase tracking-[.10em] text-slate-500">{label}</p><p className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">{value}</p></div>;
}
