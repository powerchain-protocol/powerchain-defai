import { API_KEY_HEADER, authorizeApiKey } from "@powerchain/backend/services/security";
import { resolveCoreRoute } from "@powerchain/backend/routing";
import { NextResponse, type NextRequest } from "next/server";
import { CORE_ROUTE_GUARDED_HEADER, evaluateCoreRoutePolicy } from "./server/routing/core-policy";

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;

const CORS_REQUEST_HEADERS = "content-type,x-api-key,idempotency-key,x-request-id,x-powerchain-jupiter-api-key,x-powerchain-jupiter-api-url";
const CORS_EXPOSE_HEADERS = "x-request-id,x-powerchain-route-id,x-powerchain-route-risk,x-powerchain-rate-class,x-powerchain-rate-limit,x-powerchain-rate-remaining,x-powerchain-rate-reset";

function allowedCorsOrigin(request: NextRequest): string | null {
  const origin = request.headers.get("origin")?.trim();
  if (!origin) return null;
  const configured = new Set((process.env.POWERCHAIN_CORS_ORIGINS ?? "").split(",").map((value) => value.trim()).filter(Boolean));
  if (configured.has(origin)) return origin;
  try { if (new URL(origin).origin === request.nextUrl.origin) return origin; } catch {}
  return null;
}

function withCors<T extends NextResponse>(response: T, request: NextRequest): T {
  const origin = allowedCorsOrigin(request);
  if (!origin) return response;
  response.headers.set("access-control-allow-origin", origin);
  response.headers.set("access-control-allow-credentials", "true");
  response.headers.set("access-control-expose-headers", CORS_EXPOSE_HEADERS);
  response.headers.append("vary", "Origin");
  return response;
}

function requestId(value: string | null): string {
  return value && REQUEST_ID_PATTERN.test(value) ? value : crypto.randomUUID();
}

function errorResponse(input: {
  code: string;
  status: number;
  traceId: string;
  routeId?: string;
  risk?: string;
  rateClass?: string;
  retryAfterMs?: number;
  rateLimit?: Readonly<{ limit: number; remaining: number; resetAt: number }>;
  allow?: readonly string[];
}) {
  const headers = new Headers({
    "cache-control": "no-store",
    "x-request-id": input.traceId,
  });
  if (input.routeId) headers.set("x-powerchain-route-id", input.routeId);
  if (input.risk) headers.set("x-powerchain-route-risk", input.risk);
  if (input.rateClass) headers.set("x-powerchain-rate-class", input.rateClass);
  if (input.retryAfterMs !== undefined) headers.set("retry-after", String(Math.max(1, Math.ceil(input.retryAfterMs / 1000))));
  if (input.rateLimit) {
    headers.set("x-powerchain-rate-limit", String(input.rateLimit.limit));
    headers.set("x-powerchain-rate-remaining", String(input.rateLimit.remaining));
    headers.set("x-powerchain-rate-reset", String(input.rateLimit.resetAt));
  }
  if (input.allow?.length) headers.set("allow", input.allow.join(", "));
  return NextResponse.json({ error: input.code, requestId: input.traceId }, { status: input.status, headers });
}

function routeMetadataHeaders(headers: Headers, route: { id: string; risk: string; rateLimit: string }) {
  headers.set("x-powerchain-route-id", route.id);
  headers.set("x-powerchain-route-risk", route.risk);
  headers.set("x-powerchain-rate-class", route.rateLimit);
}

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const traceId = requestId(requestHeaders.get("x-request-id"));
  requestHeaders.set("x-request-id", traceId);

  const apiV1Request = request.nextUrl.pathname.startsWith("/api/v1/");
  if (apiV1Request && request.method === "OPTIONS") {
    const origin = allowedCorsOrigin(request);
    if (!origin) return new NextResponse(null, { status: 403, headers: { "cache-control": "no-store", "x-request-id": traceId } });
    const response = new NextResponse(null, { status: 204 });
    response.headers.set("access-control-allow-origin", origin);
    response.headers.set("access-control-allow-credentials", "true");
    response.headers.set("access-control-allow-methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    response.headers.set("access-control-allow-headers", CORS_REQUEST_HEADERS);
    response.headers.set("access-control-max-age", "600");
    response.headers.set("access-control-expose-headers", CORS_EXPOSE_HEADERS);
    response.headers.set("vary", "Origin");
    response.headers.set("x-request-id", traceId);
    return response;
  }
  if (apiV1Request) {
    const authorization = authorizeApiKey(requestHeaders.get(API_KEY_HEADER));
    if (!authorization.ok) {
      const response = errorResponse({
        code: authorization.code,
        status: authorization.code === "API_KEY_NOT_CONFIGURED" ? 503 : 401,
        traceId,
      });
      response.headers.set("www-authenticate", 'ApiKey realm="PowerChain DeFAI"');
      return withCors(response, request);
    }
  }

  let registeredRoute: ReturnType<typeof resolveCoreRoute>["route"] | undefined;
  if (apiV1Request) {
    try {
      const resolution = resolveCoreRoute(request.method, request.nextUrl.pathname);
      registeredRoute = resolution.route;
      routeMetadataHeaders(requestHeaders, resolution.route);

      const policy = evaluateCoreRoutePolicy(request, resolution.route);
      if (!policy.ok) {
        return withCors(errorResponse({
          code: policy.code,
          status: policy.status,
          traceId,
          routeId: resolution.route.id,
          risk: resolution.route.risk,
          rateClass: resolution.route.rateLimit,
          ...(policy.rateLimit ? { retryAfterMs: policy.rateLimit.retryAfterMs, rateLimit: policy.rateLimit } : {}),
        }), request);
      }

      requestHeaders.set(CORE_ROUTE_GUARDED_HEADER, "1");
      requestHeaders.set("x-powerchain-rate-limit", String(policy.rateLimit.limit));
      requestHeaders.set("x-powerchain-rate-remaining", String(policy.rateLimit.remaining));
      requestHeaders.set("x-powerchain-rate-reset", String(policy.rateLimit.resetAt));
    } catch (error) {
      const allowedMethods = error instanceof Error && "allowedMethods" in error
        ? (error as Error & { allowedMethods?: readonly string[] }).allowedMethods
        : undefined;
      if (allowedMethods?.length) {
        return withCors(errorResponse({ code: "API_METHOD_NOT_ALLOWED", status: 405, traceId, allow: allowedMethods }), request);
      }
      // The critical-route registry is intentionally a subset of all generated
      // API routes. Unknown routes remain compatible and continue to Next.
    }
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("x-request-id", traceId);

  const apiRequestForHeaders = request.nextUrl.pathname.startsWith("/api/");
  response.headers.set("x-robots-tag", apiRequestForHeaders ? "noindex, nofollow" : "index, follow");
  if (apiRequestForHeaders) {
    response.headers.set("cache-control", "no-store");
    if (registeredRoute) {
      routeMetadataHeaders(response.headers, registeredRoute);
      response.headers.append("server-timing", `powerchain-route;desc=\"${registeredRoute.id}\"`);
      for (const header of ["x-powerchain-rate-limit", "x-powerchain-rate-remaining", "x-powerchain-rate-reset"] as const) {
        const value = requestHeaders.get(header);
        if (value) response.headers.set(header, value);
      }
    }
  }
  return withCors(response, request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|manifest.webmanifest|robots.txt|sitemap.xml).*)"],
};
