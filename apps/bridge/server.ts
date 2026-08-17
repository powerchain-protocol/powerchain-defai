export const NO_STORE_HEADERS = Object.freeze({
  "cache-control": "no-store, max-age=0",
  pragma: "no-cache",
  "x-content-type-options": "nosniff",
});

const SAFE_ERROR_CODE = /^[A-Z][A-Z0-9:_-]{1,119}$/;

export function noStoreHeaders(headers?: HeadersInit): Headers {
  const result = new Headers(headers);
  for (const [key, value] of Object.entries(NO_STORE_HEADERS)) if (!result.has(key)) result.set(key, value);
  return result;
}

/**
 * Return only explicit machine-style error codes. Free-form Error messages can
 * contain provider URLs, RPC details or user input and must not be reflected.
 */
export function safeServerErrorCode(reason: unknown, fallback = "INTERNAL_ERROR"): string {
  const safeFallback = SAFE_ERROR_CODE.test(fallback) ? fallback : "INTERNAL_ERROR";
  if (!(reason instanceof Error)) return safeFallback;
  const candidate = reason.message.trim();
  return SAFE_ERROR_CODE.test(candidate) ? candidate : safeFallback;
}

export function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return Response.json(body, { ...init, headers: noStoreHeaders(init.headers) });
}
