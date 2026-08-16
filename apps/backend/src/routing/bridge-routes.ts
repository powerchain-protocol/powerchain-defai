import type { RouteDefinition } from "./routes";

export const BRIDGE_ROUTES = [
  { id: "bridge-config", method: "GET", path: "/api/v1/bridge/config", risk: "public-read", rateLimit: "light" },
  { id: "bridge-history", method: "GET", path: "/api/v1/bridge/history", risk: "public-read", rateLimit: "standard" },
  { id: "bridge-quote", method: "POST", path: "/api/v1/bridge/quote", risk: "wallet-write", rateLimit: "strict" },
  { id: "bridge-routes", method: "GET", path: "/api/v1/bridge/routes", risk: "public-read", rateLimit: "light" },
  { id: "bridge-runtime", method: "GET", path: "/api/v1/bridge/runtime", risk: "public-read", rateLimit: "standard" },
  { id: "bridge-transfer-create", method: "POST", path: "/api/v1/bridge/transfers", risk: "wallet-write", rateLimit: "strict" },
] as const satisfies readonly RouteDefinition[];
