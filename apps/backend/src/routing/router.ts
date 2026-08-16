import { findCoreRoute, type RouteDefinition } from "./routes";

export type RouteResolution = { route: RouteDefinition; normalizedPath: string };
export function normalizeApiPath(pathname: string): string { const clean = pathname.split("?")[0]?.replace(/\/{2,}/g, "/").replace(/\/$/, "") || "/"; if (!clean.startsWith("/api/")) throw new Error("API_PATH_INVALID"); if (clean.includes("..")) throw new Error("API_PATH_TRAVERSAL_FORBIDDEN"); return clean; }
export function resolveCoreRoute(method: string, pathname: string): RouteResolution { const normalizedPath = normalizeApiPath(pathname); const route = findCoreRoute(method, normalizedPath); if (!route) throw new Error("API_ROUTE_NOT_REGISTERED"); return { route, normalizedPath }; }
