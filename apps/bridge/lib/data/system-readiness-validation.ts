import type { SystemReadinessPayload } from "@/types/system-readiness";

export function isSystemReadinessPayload(value: unknown): value is SystemReadinessPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  if (!(["ready", "degraded", "blocked"] as const).includes(item.state as never)) return false;
  if (typeof item.checkedAt !== "string" || !Number.isFinite(Date.parse(item.checkedAt))) return false;
  if (typeof item.productionMode !== "boolean" || item.authoritativeForBalances !== false || item.authoritativeForSettlement !== false) return false;
  if (!item.capabilities || typeof item.capabilities !== "object" || Array.isArray(item.capabilities)) return false;
  const capabilities = item.capabilities as Record<string, unknown>;
  if (["reads", "newOperations", "asyncSettlement"].some((key) => typeof capabilities[key] !== "boolean")) return false;
  if (!item.checks || typeof item.checks !== "object" || Array.isArray(item.checks)) return false;
  const checks = item.checks as Record<string, unknown>;
  for (const key of ["database", "providers", "workers", "queues", "routePolicy", "maintenance"] as const) {
    if (!checks[key] || typeof checks[key] !== "object" || Array.isArray(checks[key])) return false;
  }
  const database = checks.database as Record<string, unknown>;
  const providers = checks.providers as Record<string, unknown>;
  const workers = checks.workers as Record<string, unknown>;
  const queues = checks.queues as Record<string, unknown>;
  const routePolicy = checks.routePolicy as Record<string, unknown>;
  const maintenance = checks.maintenance as Record<string, unknown>;
  if (typeof database.ready !== "boolean" || typeof providers.ready !== "boolean" || typeof providers.degraded !== "boolean") return false;
  if (typeof workers.ready !== "boolean" || typeof workers.observed !== "number" || typeof workers.readyCount !== "number" || typeof workers.expected !== "number") return false;
  if (!Array.isArray(workers.missing) || !workers.missing.every((value) => typeof value === "string")) return false;
  if (!Array.isArray(workers.stale) || !workers.stale.every((value) => typeof value === "string")) return false;
  if (![workers.observed, workers.readyCount, workers.expected].every((value) => Number.isInteger(value) && Number(value) >= 0)) return false;
  if (Number(workers.observed) > Number(workers.expected) || Number(workers.readyCount) > Number(workers.observed)) return false;
  if (typeof queues.attention !== "number" || typeof queues.pending !== "number" || !["normal", "elevated", "high"].includes(String(queues.pressure))) return false;
  if (!(queues.oldestPendingAgeMs === null || (typeof queues.oldestPendingAgeMs === "number" && Number.isFinite(queues.oldestPendingAgeMs) && queues.oldestPendingAgeMs >= 0))) return false;
  if (!["normal", "elevated", "high"].includes(String(routePolicy.pressure)) || typeof routePolicy.utilization !== "number") return false;
  if (typeof maintenance.draining !== "boolean" || typeof maintenance.quiescent !== "boolean" || !Number.isInteger(maintenance.activeLeases) || Number(maintenance.activeLeases) < 0) return false;
  if (!["environment-override", "database", "database-unavailable"].includes(String(maintenance.source)) || !Number.isInteger(maintenance.revision) || Number(maintenance.revision) < 0 || typeof maintenance.readHealthy !== "boolean") return false;
  if (typeof maintenance.checkedAt !== "string" || !Number.isFinite(Date.parse(maintenance.checkedAt))) return false;
  if (!(maintenance.lastSuccessfulReadAt === null || (typeof maintenance.lastSuccessfulReadAt === "string" && Number.isFinite(Date.parse(maintenance.lastSuccessfulReadAt))))) return false;
  if (typeof maintenance.cacheAgeMs !== "number" || !Number.isFinite(maintenance.cacheAgeMs) || maintenance.cacheAgeMs < 0) return false;
  return Number.isFinite(routePolicy.utilization) && routePolicy.utilization >= 0 && routePolicy.utilization <= 1;
}
