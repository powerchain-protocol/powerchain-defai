import "server-only";
import type { NextRequest } from "next/server";
import { consumeRateLimit } from "@powerchain/backend/utils/rate-limiter";
import { featureFlags } from "@powerchain/backend/config/runtime-features";
import { crossChainProviderPolicy } from "@powerchain/backend/config/cross-chain";
import { clientIpSecurityContext } from "@powerchain/backend/services/ip-security";
import type { RouteDefinition } from "@powerchain/backend/routing";

export const CORE_ROUTE_GUARDED_HEADER = "x-powerchain-core-route-guarded" as const;

export type CoreRoutePolicyDecision =
  | Readonly<{ ok: true; rateLimit: ReturnType<typeof consumeRateLimit> }>
  | Readonly<{ ok: false; code: string; status: 429 | 503; rateLimit?: ReturnType<typeof consumeRateLimit> }>;

function clientKey(request: NextRequest): string {
  return clientIpSecurityContext(request.headers).pseudonymousKey ?? "anonymous";
}

function rateConfig(kind: RouteDefinition["rateLimit"]): Readonly<{ limit: number; windowMs: number }> {
  if (kind === "strict") return { limit: 20, windowMs: 60_000 };
  if (kind === "standard") return { limit: 60, windowMs: 60_000 };
  return { limit: 120, windowMs: 60_000 };
}

function featureFailure(route: RouteDefinition): string | null {
  const flags = featureFlags();
  if (route.path.startsWith("/api/v1/swap/") && !flags.swap) return "FEATURE_SWAP_DISABLED";
  if (route.path.startsWith("/api/v1/bridge/") && !route.path.endsWith("/openapi")) {
    const crossChain = crossChainProviderPolicy();
    if (!flags.bridge) return "FEATURE_BRIDGE_DISABLED";
    if (!flags.crossChain) return "FEATURE_CROSS_CHAIN_DISABLED";
    if (!crossChain.wormhole.enabled) return "WORMHOLE_DISABLED";
  }
  return null;
}

/**
 * Evaluate static feature and bounded process-local rate policy for one
 * registered critical route. Dynamic route params are deliberately excluded.
 */
export function evaluateCoreRoutePolicy(request: NextRequest, route: RouteDefinition): CoreRoutePolicyDecision {
  const featureCode = featureFailure(route);
  if (featureCode) return { ok: false, code: featureCode, status: 503 };

  const config = rateConfig(route.rateLimit);
  const rateLimit = consumeRateLimit(`${route.id}:${clientKey(request)}`, config.limit, config.windowMs);
  if (!rateLimit.ok) return { ok: false, code: "RATE_LIMITED", status: 429, rateLimit };
  return { ok: true, rateLimit };
}
