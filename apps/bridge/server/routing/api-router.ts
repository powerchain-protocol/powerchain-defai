import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { resolveCoreRoute } from "@powerchain/backend/routing";
import { safeRequestId, sanitizePublicErrorCode } from "@powerchain/backend/services/security";
import { CORE_ROUTE_GUARDED_HEADER, evaluateCoreRoutePolicy } from "./core-policy";

function policyFailureResponse(input: {
  code: string;
  status: 429 | 503;
  requestId: string;
  route: ReturnType<typeof resolveCoreRoute>["route"];
  retryAfterMs?: number;
}) {
  const headers = new Headers({
    "cache-control": "no-store",
    "x-request-id": input.requestId,
    "x-powerchain-route-id": input.route.id,
    "x-powerchain-route-risk": input.route.risk,
    "x-powerchain-rate-class": input.route.rateLimit,
  });
  if (input.retryAfterMs !== undefined) headers.set("retry-after", String(Math.max(1, Math.ceil(input.retryAfterMs / 1000))));
  return NextResponse.json({ error: input.code, requestId: input.requestId }, { status: input.status, headers });
}

/**
 * Route-handler compatibility guard. The proxy performs this policy once for
 * registered critical routes and marks the forwarded request. Direct route
 * invocation in tests/dev still gets the same fail-closed policy here.
 */
export function enforceCoreRoute(request: NextRequest) {
  const resolution = resolveCoreRoute(request.method, request.nextUrl.pathname);
  const requestId = safeRequestId(request.headers.get("x-request-id"));

  if (request.headers.get(CORE_ROUTE_GUARDED_HEADER) !== "1") {
    const policy = evaluateCoreRoutePolicy(request, resolution.route);
    if (!policy.ok) {
      return {
        ok: false as const,
        response: policyFailureResponse({
          code: policy.code,
          status: policy.status,
          requestId,
          route: resolution.route,
          ...(policy.rateLimit ? { retryAfterMs: policy.rateLimit.retryAfterMs } : {}),
        }),
      };
    }
  }

  return { ok: true as const, route: resolution.route, params: resolution.params, requestId };
}

export function routeError(error: unknown, status = 400, requestId?: string) {
  return NextResponse.json(
    { error: sanitizePublicErrorCode(error), ...(requestId ? { requestId } : {}) },
    { status, headers: { "cache-control": "no-store", ...(requestId ? { "x-request-id": requestId } : {}) } },
  );
}
