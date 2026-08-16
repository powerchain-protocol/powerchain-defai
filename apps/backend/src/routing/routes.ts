import { BRIDGE_ROUTES } from "./bridge-routes";
import { SWAP_ROUTES } from "./swap-routes";

export const API_VERSION = "v1" as const;
export type RouteRisk = "public-read" | "wallet-read" | "wallet-write" | "operator";
export type RouteDefinition = { id: string; method: "GET" | "POST" | "PATCH" | "DELETE"; path: string; risk: RouteRisk; rateLimit: "light" | "standard" | "strict" };

export const SHARED_ROUTES = [
  { id: "health", method: "GET", path: "/api/v1/health", risk: "public-read", rateLimit: "light" },
  { id: "ready", method: "GET", path: "/api/v1/ready", risk: "public-read", rateLimit: "light" },
  { id: "currencies", method: "GET", path: "/api/v1/currencies", risk: "public-read", rateLimit: "light" },
  { id: "blockchains", method: "GET", path: "/api/v1/blockchains", risk: "public-read", rateLimit: "light" },
  { id: "clusters", method: "GET", path: "/api/v1/clusters", risk: "public-read", rateLimit: "light" },
  { id: "rpc-status", method: "GET", path: "/api/v1/rpc/status", risk: "public-read", rateLimit: "standard" },
  { id: "prices", method: "GET", path: "/api/v1/market/prices", risk: "public-read", rateLimit: "standard" },
  { id: "rates", method: "GET", path: "/api/v1/market/rates", risk: "public-read", rateLimit: "standard" },
  { id: "calculator", method: "POST", path: "/api/v1/calculators/transaction", risk: "public-read", rateLimit: "standard" },
  { id: "security-policy", method: "GET", path: "/api/v1/security/policy", risk: "public-read", rateLimit: "light" },
] as const satisfies readonly RouteDefinition[];

export { BRIDGE_ROUTES, SWAP_ROUTES };
export const CORE_ROUTES = [...SHARED_ROUTES, ...BRIDGE_ROUTES, ...SWAP_ROUTES] as const satisfies readonly RouteDefinition[];
export function findCoreRoute(method: string, pathname: string): RouteDefinition | null { return CORE_ROUTES.find((route) => route.method === method.toUpperCase() && route.path === pathname) ?? null; }
