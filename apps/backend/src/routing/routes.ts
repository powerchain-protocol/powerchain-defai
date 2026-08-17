import { BRIDGE_ROUTES } from "./bridge-routes";
import { SWAP_ROUTES } from "./swap-routes";

export const API_VERSION = "v1" as const;
export type RouteRisk = "public-read" | "wallet-read" | "wallet-write" | "operator";
export type RouteDefinition = { id: string; method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; path: string; risk: RouteRisk; rateLimit: "light" | "standard" | "strict" };
export type RouteMatch = Readonly<{ route: RouteDefinition; params: Readonly<Record<string, string>> }>;

export const SHARED_ROUTES = [
  { id: "health", method: "GET", path: "/api/v1/health", risk: "public-read", rateLimit: "light" },
  { id: "version", method: "GET", path: "/api/v1/version", risk: "public-read", rateLimit: "light" },
  { id: "ready", method: "GET", path: "/api/v1/ready", risk: "public-read", rateLimit: "light" },
  { id: "currencies", method: "GET", path: "/api/v1/currencies", risk: "public-read", rateLimit: "light" },
  { id: "blockchains", method: "GET", path: "/api/v1/blockchains", risk: "public-read", rateLimit: "light" },
  { id: "clusters", method: "GET", path: "/api/v1/clusters", risk: "public-read", rateLimit: "light" },
  { id: "rpc-status", method: "GET", path: "/api/v1/rpc/status", risk: "public-read", rateLimit: "standard" },
  { id: "providers-health", method: "GET", path: "/api/v1/providers/health", risk: "public-read", rateLimit: "standard" },
  { id: "providers-readiness", method: "GET", path: "/api/v1/providers/readiness", risk: "public-read", rateLimit: "standard" },
  { id: "providers-diagnostics", method: "GET", path: "/api/v1/providers/diagnostics", risk: "public-read", rateLimit: "standard" },
  { id: "staking-status", method: "GET", path: "/api/v1/staking/status", risk: "public-read", rateLimit: "standard" },
  { id: "staking-position", method: "GET", path: "/api/v1/staking/position", risk: "wallet-read", rateLimit: "standard" },
  { id: "staking-transaction-status", method: "GET", path: "/api/v1/staking/transactions/:signature", risk: "wallet-read", rateLimit: "standard" },
  { id: "escrow-readiness", method: "GET", path: "/api/v1/escrow/readiness", risk: "public-read", rateLimit: "standard" },
  { id: "programs-readiness", method: "GET", path: "/api/v1/programs/readiness", risk: "public-read", rateLimit: "standard" },
  { id: "program-readiness-item", method: "GET", path: "/api/v1/programs/readiness/:programId", risk: "public-read", rateLimit: "standard" },
  { id: "payment-checkout", method: "POST", path: "/api/v1/payments/checkout", risk: "wallet-write", rateLimit: "strict" },
  { id: "payment-solana-pay", method: "POST", path: "/api/v1/payments/solana-pay", risk: "wallet-write", rateLimit: "strict" },
  { id: "payment-status", method: "GET", path: "/api/v1/payments/status", risk: "wallet-read", rateLimit: "standard" },
  { id: "wallet-overview", method: "GET", path: "/api/v1/wallet/overview", risk: "wallet-read", rateLimit: "standard" },
  { id: "wallet-portfolio", method: "GET", path: "/api/v1/wallet/portfolio", risk: "wallet-read", rateLimit: "standard" },
  { id: "wallet-activity", method: "GET", path: "/api/v1/wallet/activity", risk: "wallet-read", rateLimit: "standard" },
  { id: "prices", method: "GET", path: "/api/v1/market/prices", risk: "public-read", rateLimit: "standard" },
  { id: "oracle-pyth-sui-updates", method: "POST", path: "/api/v1/oracles/pyth/sui/updates", risk: "public-read", rateLimit: "strict" },
  { id: "rates", method: "GET", path: "/api/v1/market/rates", risk: "public-read", rateLimit: "standard" },
  { id: "calculator", method: "POST", path: "/api/v1/calculators/transaction", risk: "public-read", rateLimit: "standard" },
  { id: "security-policy", method: "GET", path: "/api/v1/security/policy", risk: "public-read", rateLimit: "light" },
  { id: "route-policy-diagnostics", method: "GET", path: "/api/v1/system/route-policy", risk: "public-read", rateLimit: "light" },
  { id: "system-readiness", method: "GET", path: "/api/v1/system/readiness", risk: "public-read", rateLimit: "light" },
  { id: "operator-operations-attention", method: "GET", path: "/api/v1/operator/operations/attention", risk: "operator", rateLimit: "strict" },
  { id: "operator-maintenance-read", method: "GET", path: "/api/v1/operator/maintenance", risk: "operator", rateLimit: "strict" },
  { id: "operator-maintenance-update", method: "PUT", path: "/api/v1/operator/maintenance", risk: "operator", rateLimit: "strict" },
] as const satisfies readonly RouteDefinition[];

export { BRIDGE_ROUTES, SWAP_ROUTES };
export const CORE_ROUTES = [...SHARED_ROUTES, ...BRIDGE_ROUTES, ...SWAP_ROUTES] as const satisfies readonly RouteDefinition[];

/** Match one registered route while keeping dynamic values out of route metadata. */
export function matchRoutePath(pattern: string, pathname: string): Readonly<Record<string, string>> | null {
  const expected = pattern.split("/");
  const actual = pathname.split("/");
  if (expected.length !== actual.length) return null;
  const params: Record<string, string> = {};
  for (let index = 0; index < expected.length; index += 1) {
    const expectedSegment = expected[index] ?? "";
    const actualSegment = actual[index] ?? "";
    if (expectedSegment.startsWith(":")) {
      if (!actualSegment) return null;
      params[expectedSegment.slice(1)] = actualSegment;
      continue;
    }
    if (expectedSegment !== actualSegment) return null;
  }
  return params;
}

export function routePathMatches(pattern: string, pathname: string): boolean {
  return matchRoutePath(pattern, pathname) !== null;
}

export function matchCoreRoute(method: string, pathname: string): RouteMatch | null {
  const normalizedMethod = method.toUpperCase();
  for (const route of CORE_ROUTES) {
    if (route.method !== normalizedMethod) continue;
    const params = matchRoutePath(route.path, pathname);
    if (params) return { route, params };
  }
  return null;
}

export function findCoreRoute(method: string, pathname: string): RouteDefinition | null {
  return matchCoreRoute(method, pathname)?.route ?? null;
}

export function allowedMethodsForCorePath(pathname: string): readonly RouteDefinition["method"][] {
  return [...new Set(CORE_ROUTES.flatMap((route) => routePathMatches(route.path, pathname) ? [route.method] : []))];
}
