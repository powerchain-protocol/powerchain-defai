import { API_KEY_HEADER, authorizeApiKey } from "@powerchain/backend/services/security";
import { NextResponse, type NextRequest } from "next/server";

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;

function requestId(value: string | null): string {
  return value && REQUEST_ID_PATTERN.test(value) ? value : crypto.randomUUID();
}

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const traceId = requestId(requestHeaders.get("x-request-id"));
  requestHeaders.set("x-request-id", traceId);

  const apiRequest = request.nextUrl.pathname.startsWith("/api/v1/");
  if (apiRequest) {
    const authorization = authorizeApiKey(requestHeaders.get(API_KEY_HEADER));
    if (!authorization.ok) {
      return NextResponse.json(
        { error: authorization.code },
        { status: authorization.code === "API_KEY_NOT_CONFIGURED" ? 503 : 401, headers: { "cache-control": "no-store", "x-request-id": traceId, "www-authenticate": 'ApiKey realm="PowerChain DeFAI"' } },
      );
    }
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("x-request-id", traceId);

  const apiRequestForHeaders = request.nextUrl.pathname.startsWith("/api/");
  response.headers.set("x-robots-tag", apiRequestForHeaders ? "noindex, nofollow" : "index, follow");
  if (apiRequestForHeaders) response.headers.set("cache-control", "no-store");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|manifest.webmanifest|robots.txt|sitemap.xml).*)"],
};
