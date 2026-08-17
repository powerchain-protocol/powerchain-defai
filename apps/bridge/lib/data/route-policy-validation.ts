import type { RoutePolicyDiagnosticsPayload, RoutePolicyPressure } from "@/types/route-policy";

const pressures = new Set<RoutePolicyPressure>(["normal", "elevated", "high"]);

function finiteNonNegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function isRoutePolicyDiagnosticsPayload(value: unknown): value is RoutePolicyDiagnosticsPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  if (item.available !== true || item.processLocal !== true || item.authoritativeForAccounting !== false) return false;
  if (typeof item.generatedAt !== "string" || !Number.isFinite(Date.parse(item.generatedAt))) return false;
  if (!item.routes || typeof item.routes !== "object" || Array.isArray(item.routes)) return false;
  if (!item.limiter || typeof item.limiter !== "object" || Array.isArray(item.limiter)) return false;
  const routes = item.routes as Record<string, unknown>;
  const limiter = item.limiter as Record<string, unknown>;
  if (!finiteNonNegative(routes.registered)) return false;
  for (const group of [routes.risks, routes.rateClasses]) {
    if (!group || typeof group !== "object" || Array.isArray(group)) return false;
    if (!Object.values(group as Record<string, unknown>).every(finiteNonNegative)) return false;
  }
  if (!finiteNonNegative(limiter.bucketCount) || !finiteNonNegative(limiter.maxBuckets) || !finiteNonNegative(limiter.pruneInterval) || !finiteNonNegative(limiter.utilization)) return false;
  if (!pressures.has(limiter.pressure as RoutePolicyPressure)) return false;
  return limiter.maxBuckets >= limiter.bucketCount && limiter.utilization <= 1;
}
