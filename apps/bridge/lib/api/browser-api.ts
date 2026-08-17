"use client";

export { POWERCHAIN_JUPITER_API_KEY_HEADER, POWERCHAIN_JUPITER_API_URL_HEADER, configuredApiBaseUrl, customApiEnabled } from "./client-routing";
import { resolveClientApiRequest } from "./client-routing";

export function apiUrl(path: string): string {
  if (!path.startsWith("/")) throw new Error("POWERCHAIN_API_PATH_INVALID");
  return String(resolveClientApiRequest(path).url);
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  if (!path.startsWith("/")) throw new Error("POWERCHAIN_API_PATH_INVALID");
  const routed = resolveClientApiRequest(path, init.headers);
  if (!routed.headers.has("accept")) routed.headers.set("accept", "application/json");
  return fetch(routed.url, { ...init, headers: routed.headers });
}
