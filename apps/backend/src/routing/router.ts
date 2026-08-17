import { allowedMethodsForCorePath, matchCoreRoute, type RouteDefinition } from "./routes";

export type RouteResolution = {
  route: RouteDefinition;
  normalizedPath: string;
  /** Dynamic values are available to trusted server code but must not be logged as route labels. */
  params: Readonly<Record<string, string>>;
};

export function normalizeApiPath(pathname: string): string {
  const raw = pathname.split("?")[0] ?? "/";
  let decoded: string;
  try { decoded = decodeURIComponent(raw); } catch { throw new Error("API_PATH_ENCODING_INVALID"); }
  const clean = decoded.replace(/\\/g, "/").replace(/\/{2,}/g, "/").replace(/\/$/, "") || "/";
  if (!clean.startsWith("/api/")) throw new Error("API_PATH_INVALID");
  const segments = clean.split("/");
  if (segments.some((segment) => segment === "." || segment === "..")) throw new Error("API_PATH_TRAVERSAL_FORBIDDEN");
  return clean;
}

export function resolveCoreRoute(method: string, pathname: string): RouteResolution {
  const normalizedPath = normalizeApiPath(pathname);
  const match = matchCoreRoute(method, normalizedPath);
  if (!match) {
    const allowed = allowedMethodsForCorePath(normalizedPath);
    if (allowed.length > 0) {
      const error = new Error("API_METHOD_NOT_ALLOWED") as Error & { allowedMethods?: readonly string[] };
      error.allowedMethods = allowed;
      throw error;
    }
    throw new Error("API_ROUTE_NOT_REGISTERED");
  }
  return { route: match.route, normalizedPath, params: match.params };
}
