import type {
  ProviderDiagnosticsPayload,
  ProviderHealthPayload,
  ProviderReadinessPayload,
  ProviderStatus,
} from "@/types/providers";

export type {
  ProviderDataSource,
  ProviderEndpointHealth,
  ProviderDiagnosticChain,
  ProviderDiagnosticEndpoint,
  ProviderDiagnosticMetrics,
  ProviderDiagnosticsPayload,
  ProviderHealthItem,
  ProviderHealthPayload,
  ProviderReadinessItem,
  ProviderReadinessPayload,
  ProviderRedundancy,
  ProviderStatus,
} from "@/types/providers";

const statuses = new Set<ProviderStatus>(["healthy", "degraded", "unavailable"]);

const diagnosticMetricNames = [
  "requests", "networkRequests", "cacheHits", "staleCacheHits", "dedupeHits", "rateLimited", "failures", "failovers",
  "active", "maxActive", "rejectedByConcurrency", "cacheEvictions", "cacheInvalidations", "budgetTimeouts", "quorumChecks",
  "quorumDisagreements", "hedgedRequests", "hedgeFallbackWins",
] as const;

function isDiagnosticMetrics(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return diagnosticMetricNames.every((name) => typeof item[name] === "number" && Number.isFinite(item[name]));
}

function isDiagnosticEndpoint(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  if (typeof item.id !== "string" || typeof item.priority !== "number" || typeof item.healthy !== "boolean") return false;
  if (item.circuit !== "closed" && item.circuit !== "half-open" && item.circuit !== "open") return false;
  for (const field of ["consecutiveFailures", "cooldownUntil", "activeRequests", "successes", "failures"] as const) {
    if (typeof item[field] !== "number" || !Number.isFinite(item[field])) return false;
  }
  for (const field of ["lastLatencyMs", "ewmaLatencyMs", "lastSuccessAt", "lastFailureAt"] as const) {
    if (item[field] !== undefined && (typeof item[field] !== "number" || !Number.isFinite(item[field]))) return false;
  }
  return true;
}

function isDiagnosticChain(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  if (typeof item.ok !== "boolean" || !statuses.has(item.status as ProviderStatus)) return false;
  if (item.latencyMs !== undefined && typeof item.latencyMs !== "number") return false;
  if (item.head !== undefined && typeof item.head !== "string") return false;
  if (item.source !== undefined && !["network", "cache", "stale-cache", "grpc"].includes(String(item.source))) return false;
  return Array.isArray(item.endpoints) && item.endpoints.every(isDiagnosticEndpoint) && isDiagnosticMetrics(item.metrics);
}

export function isProviderDiagnosticsPayload(value: unknown): value is ProviderDiagnosticsPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  if (typeof item.available !== "boolean" || item.processLocal !== true || item.authoritativeForAccounting !== false || typeof item.generatedAt !== "string" || !Number.isFinite(Date.parse(item.generatedAt))) return false;
  if (!item.chains || typeof item.chains !== "object" || Array.isArray(item.chains)) return false;
  const chains = item.chains as Record<string, unknown>;
  return isDiagnosticChain(chains.solana) && isDiagnosticChain(chains.sui);
}

export function isProviderHealthPayload(value: unknown): value is ProviderHealthPayload {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  if (typeof item.ok !== "boolean" || !statuses.has(item.status as ProviderStatus) || typeof item.checkedAt !== "string") return false;
  if (!Number.isFinite(Date.parse(item.checkedAt)) || !Array.isArray(item.providers)) return false;
  return item.providers.every((provider) => {
    if (!provider || typeof provider !== "object") return false;
    const p = provider as Record<string, unknown>;
    if (!((p.provider === "solana" || p.provider === "sui") && typeof p.ok === "boolean" && statuses.has(p.status as ProviderStatus))) return false;
    if (p.latencyMs !== undefined && typeof p.latencyMs !== "number") return false;
    if (p.head !== undefined && typeof p.head !== "string") return false;
    if (p.source !== undefined && !["network", "cache", "stale-cache", "grpc"].includes(String(p.source))) return false;
    if (p.endpoints !== undefined) {
      if (!Array.isArray(p.endpoints)) return false;
      if (!p.endpoints.every((endpoint) => {
        if (!endpoint || typeof endpoint !== "object" || Array.isArray(endpoint)) return false;
        const e = endpoint as Record<string, unknown>;
        if (e.id !== undefined && typeof e.id !== "string") return false;
        if (e.healthy !== undefined && typeof e.healthy !== "boolean") return false;
        return e.circuit === undefined || e.circuit === "closed" || e.circuit === "half-open" || e.circuit === "open";
      })) return false;
    }
    return true;
  });
}

export function isProviderReadinessPayload(value: unknown): value is ProviderReadinessPayload {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  if (typeof item.ready !== "boolean" || typeof item.checkedAt !== "string" || !Number.isFinite(Date.parse(item.checkedAt))) return false;
  if (item.degraded !== undefined && typeof item.degraded !== "boolean") return false;
  if (item.redundancy !== undefined && item.redundancy !== "full" && item.redundancy !== "reduced" && item.redundancy !== "none") return false;
  if (item.providers !== undefined) {
    if (!Array.isArray(item.providers)) return false;
    if (!item.providers.every((provider) => {
      if (!provider || typeof provider !== "object") return false;
      const p = provider as Record<string, unknown>;
      if (p.provider !== "solana" && p.provider !== "sui") return false;
      if (typeof p.ready !== "boolean") return false;
      if (p.redundancy !== "full" && p.redundancy !== "reduced" && p.redundancy !== "none") return false;
      if (p.head !== undefined && typeof p.head !== "string") return false;
      return true;
    })) return false;
  }
  return true;
}

export function ageMs(iso: string | undefined, now = Date.now()) {
  if (!iso) return Number.POSITIVE_INFINITY;
  const parsed = Date.parse(iso);
  return Number.isFinite(parsed) ? Math.max(0, now - parsed) : Number.POSITIVE_INFINITY;
}
