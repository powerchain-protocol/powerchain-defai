import { rateLimiterDiagnostics } from "../utils/rate-limiter";
import { CORE_ROUTES, type RouteRisk } from "./routes";

export type RoutePolicyPressure = "normal" | "elevated" | "high";

function countBy<T extends string>(values: readonly T[]): Readonly<Record<T, number>> {
  const result = {} as Record<T, number>;
  for (const value of values) result[value] = (result[value] ?? 0) + 1;
  return Object.freeze(result);
}

/**
 * Sanitized process-local policy diagnostics.
 * Never include rate-limit bucket keys, client identifiers, route parameters,
 * wallet addresses, signatures, query strings, request bodies, or secrets.
 */
export function routePolicyDiagnostics() {
  const limiter = rateLimiterDiagnostics();
  const utilization = limiter.maxBuckets > 0 ? limiter.bucketCount / limiter.maxBuckets : 0;
  const pressure: RoutePolicyPressure = utilization >= 0.9 ? "high" : utilization >= 0.7 ? "elevated" : "normal";
  const risks = countBy(CORE_ROUTES.map((route) => route.risk));
  const rateClasses = countBy(CORE_ROUTES.map((route) => route.rateLimit));

  return Object.freeze({
    available: true as const,
    generatedAt: new Date().toISOString(),
    processLocal: true as const,
    authoritativeForAccounting: false as const,
    routes: Object.freeze({
      registered: CORE_ROUTES.length,
      risks: Object.freeze({
        "public-read": risks["public-read" as RouteRisk] ?? 0,
        "wallet-read": risks["wallet-read" as RouteRisk] ?? 0,
        "wallet-write": risks["wallet-write" as RouteRisk] ?? 0,
        operator: risks.operator ?? 0,
      }),
      rateClasses: Object.freeze({
        light: rateClasses.light ?? 0,
        standard: rateClasses.standard ?? 0,
        strict: rateClasses.strict ?? 0,
      }),
    }),
    limiter: Object.freeze({
      bucketCount: limiter.bucketCount,
      maxBuckets: limiter.maxBuckets,
      pruneInterval: limiter.pruneInterval,
      utilization,
      pressure,
    }),
  });
}
