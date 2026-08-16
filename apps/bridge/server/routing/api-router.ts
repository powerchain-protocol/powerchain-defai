import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { resolveCoreRoute } from "@powerchain/backend/routing";
import { consumeRateLimit } from "@powerchain/backend/utils/rate-limiter";
import { safeRequestId, sanitizePublicErrorCode } from "@powerchain/backend/services/security";
import { clientIpSecurityContext } from "@powerchain/backend/services/ip-security";
import { featureFlags } from "@powerchain/backend/config/runtime-features";
import { crossChainProviderPolicy } from "@powerchain/backend/config/cross-chain";

function clientKey(request: NextRequest) { const context = clientIpSecurityContext(request.headers); return context.pseudonymousKey ?? "anonymous"; }
function rateConfig(kind: "light" | "standard" | "strict") { return kind === "strict" ? { limit: 20, windowMs: 60_000 } : kind === "standard" ? { limit: 60, windowMs: 60_000 } : { limit: 120, windowMs: 60_000 }; }

export function enforceCoreRoute(request: NextRequest) {
  const resolution = resolveCoreRoute(request.method, request.nextUrl.pathname);
  const flags = featureFlags();
  const path = request.nextUrl.pathname;
  const docsRoute = path.endsWith("/openapi");
  if (!docsRoute && path.startsWith("/api/v1/swap/") && !flags.swap) return { ok: false as const, response: NextResponse.json({ error: "FEATURE_SWAP_DISABLED" }, { status: 503, headers: { "cache-control": "no-store" } }) };
  if (!docsRoute && path.startsWith("/api/v1/bridge/")) { const crossChain = crossChainProviderPolicy(); if (!flags.bridge || !flags.crossChain || !crossChain.wormhole.enabled) return { ok: false as const, response: NextResponse.json({ error: !flags.bridge ? "FEATURE_BRIDGE_DISABLED" : !flags.crossChain ? "FEATURE_CROSS_CHAIN_DISABLED" : "WORMHOLE_DISABLED" }, { status: 503, headers: { "cache-control": "no-store" } }) }; }
  const cfg = rateConfig(resolution.route.rateLimit); const bucket = consumeRateLimit(`${resolution.route.id}:${clientKey(request)}`, cfg.limit, cfg.windowMs);
  if (!bucket.ok) return { ok: false as const, response: NextResponse.json({ error: "RATE_LIMITED", retryAfterMs: bucket.retryAfterMs }, { status: 429, headers: { "cache-control": "no-store", "retry-after": String(Math.max(1, Math.ceil(bucket.retryAfterMs / 1000))) } }) };
  return { ok: true as const, route: resolution.route, requestId: safeRequestId(request.headers.get("x-request-id")) };
}

export function routeError(error: unknown, status = 400) { return NextResponse.json({ error: sanitizePublicErrorCode(error) }, { status, headers: { "cache-control": "no-store" } }); }
