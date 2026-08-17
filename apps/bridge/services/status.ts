import { STATUS_SERVICE_LABELS } from "@/constants/status";
import type { ProviderReadinessPayload } from "@/types/providers";
import type { SystemReadinessPayload } from "@/types/system-readiness";
import type { StatusService } from "@/types/status";
import { statusStateFromPressure, statusStateFromProvider, statusStateFromSystem } from "@/utils/health";

export function buildStatusServices(input: { system?: SystemReadinessPayload; readiness?: ProviderReadinessPayload; checking?: boolean }): StatusService[] {
  const { system, readiness, checking = false } = input;
  const checkedAt = system?.checkedAt ?? readiness?.checkedAt;
  const rows: StatusService[] = [];
  if (system) {
    rows.push({ id: "system", label: STATUS_SERVICE_LABELS.system, description: "Aggregate read/write execution gate", state: statusStateFromSystem(system.state), detail: system.capabilities.newOperations ? "New wallet operations enabled" : "New wallet operations blocked", ...(checkedAt ? { updatedAt: checkedAt } : {}) });
    rows.push({ id: "database", label: STATUS_SERVICE_LABELS.database, description: "Persisted operation and reconciliation state", state: system.checks.database.ready ? "operational" : "outage", detail: system.checks.database.ready ? "Persistence ready" : "Persistence unavailable", ...(checkedAt ? { updatedAt: checkedAt } : {}) });
    rows.push({ id: "workers", label: STATUS_SERVICE_LABELS.workers, description: "Claims, bridge and fee worker heartbeat state", state: system.checks.workers.ready ? "operational" : system.checks.workers.readyCount > 0 ? "degraded" : "outage", detail: `${system.checks.workers.readyCount}/${system.checks.workers.expected} ready`, ...(checkedAt ? { updatedAt: checkedAt } : {}) });
    rows.push({ id: "queues", label: STATUS_SERVICE_LABELS.queues, description: "Pending asynchronous execution backlog", state: statusStateFromPressure(system.checks.queues.pressure), detail: `${system.checks.queues.pending} pending · ${system.checks.queues.attention} attention`, ...(checkedAt ? { updatedAt: checkedAt } : {}) });
    rows.push({ id: "routing", label: STATUS_SERVICE_LABELS.routing, description: "Critical-route limiter and request policy", state: statusStateFromPressure(system.checks.routePolicy.pressure), detail: `${Math.round(system.checks.routePolicy.utilization * 100)}% limiter utilization`, ...(checkedAt ? { updatedAt: checkedAt } : {}) });
  }
  for (const id of ["solana", "sui"] as const) {
    const provider = readiness?.providers?.find((item) => item.provider === id);
    rows.push({ id, label: STATUS_SERVICE_LABELS[id], description: `${id === "solana" ? "Solana" : "Sui"} RPC/provider redundancy`, state: checking ? "checking" : statusStateFromProvider(provider), detail: provider ? `${provider.redundancy} redundancy${provider.configuredEndpoints ? ` · ${provider.configuredEndpoints} endpoints` : ""}` : "Readiness unavailable", ...(provider?.latencyMs === undefined ? {} : { latencyMs: provider.latencyMs }), ...(checkedAt ? { updatedAt: checkedAt } : {}) });
  }
  return rows;
}
