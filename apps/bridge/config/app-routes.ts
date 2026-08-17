/** Canonical browser routes for the PowerChain DeFAI application. */
export const APP_ROUTES = Object.freeze({
  home: "/",
  dashboard: "/",
  chat: "/chat",
  swap: "/swap",
  bridge: "/bridge",
  staking: "/staking",
  wallet: "/wallet",
  claim: "/claim",
  assets: "/assets",
  history: "/history",
  explorer: "/explorer",
  fees: "/fees",
  integrations: "/integrations",
  protocol: "/protocol",
  status: "/status",
  profile: "/profile",
  settings: "/settings",
  legal: "/legal",
  privacy: "/legal/privacy",
  terms: "/legal/terms",
  disclaimer: "/legal/disclaimer",
  cookies: "/legal/cookies",
  apiDocs: "/api/v1/openapi",
  bridgeApiDocs: "/api/v1/bridge/openapi",
  swapApiDocs: "/api/v1/swap/openapi",
} as const);

export type AppRoute = (typeof APP_ROUTES)[keyof typeof APP_ROUTES];

/** Page routes that are expected to remain reachable directly (not compatibility aliases). */
export const CANONICAL_PAGE_ROUTES = Object.freeze([
  APP_ROUTES.dashboard,
  APP_ROUTES.chat,
  APP_ROUTES.swap,
  APP_ROUTES.bridge,
  APP_ROUTES.staking,
  APP_ROUTES.wallet,
  APP_ROUTES.claim,
  APP_ROUTES.assets,
  APP_ROUTES.history,
  APP_ROUTES.explorer,
  APP_ROUTES.fees,
  APP_ROUTES.integrations,
  APP_ROUTES.protocol,
  APP_ROUTES.status,
  APP_ROUTES.profile,
  APP_ROUTES.settings,
  APP_ROUTES.legal,
  APP_ROUTES.privacy,
  APP_ROUTES.terms,
  APP_ROUTES.disclaimer,
  APP_ROUTES.cookies,
] as const);

/** Routes that belong to the persistent authenticated/operational workspace shell. */
export const DASHBOARD_WORKSPACE_ROUTES = Object.freeze([
  APP_ROUTES.dashboard,
  APP_ROUTES.chat,
  APP_ROUTES.swap,
  APP_ROUTES.bridge,
  APP_ROUTES.staking,
  APP_ROUTES.wallet,
  APP_ROUTES.claim,
  APP_ROUTES.assets,
  APP_ROUTES.history,
  APP_ROUTES.explorer,
  APP_ROUTES.fees,
  APP_ROUTES.integrations,
  APP_ROUTES.protocol,
  APP_ROUTES.status,
  APP_ROUTES.profile,
  APP_ROUTES.settings,
] as const);

export function isDashboardWorkspaceRoute(pathname: string): boolean {
  return DASHBOARD_WORKSPACE_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
    || pathname.startsWith('/claims/status/')
    || pathname.startsWith('/bridge/status/');
}

export const APP_REDIRECTS = [
  { source: "/dashboard", destination: APP_ROUTES.dashboard, permanent: true },
  { source: "/home", destination: APP_ROUTES.dashboard, permanent: true },
  { source: "/app", destination: APP_ROUTES.dashboard, permanent: true },
  { source: "/defai", destination: APP_ROUTES.chat, permanent: true },
  { source: "/assistant", destination: APP_ROUTES.chat, permanent: true },
  { source: "/stake", destination: APP_ROUTES.staking, permanent: true },
  { source: "/rewards", destination: APP_ROUTES.staking, permanent: true },
  { source: "/validators", destination: APP_ROUTES.staking, permanent: true },
  { source: "/programs", destination: APP_ROUTES.protocol, permanent: true },
  { source: "/contracts", destination: APP_ROUTES.protocol, permanent: true },
  { source: "/trade", destination: APP_ROUTES.swap, permanent: true },
  { source: "/transactions", destination: APP_ROUTES.history, permanent: true },
  { source: "/activity", destination: APP_ROUTES.history, permanent: true },
  { source: "/portfolio", destination: APP_ROUTES.wallet, permanent: true },
  { source: "/user", destination: APP_ROUTES.profile, permanent: true },
  { source: "/preferences", destination: APP_ROUTES.settings, permanent: true },
  { source: "/account", destination: APP_ROUTES.wallet, permanent: true },
  { source: "/docs", destination: APP_ROUTES.apiDocs, permanent: false },
  { source: "/api/bridge", destination: APP_ROUTES.bridgeApiDocs, permanent: false },
  { source: "/api/swap", destination: APP_ROUTES.swapApiDocs, permanent: false },
  { source: "/api", destination: APP_ROUTES.apiDocs, permanent: false },
  { source: "/api/openapi", destination: APP_ROUTES.apiDocs, permanent: true },
  { source: "/openapi", destination: APP_ROUTES.apiDocs, permanent: true },
  { source: "/swagger", destination: APP_ROUTES.apiDocs, permanent: true },
] as const;

const ROUTE_SEGMENT_PATTERN = /^[A-Za-z0-9._~-]{1,256}$/;

/**
 * Encode an externally sourced route id without allowing path traversal or
 * encoded slash/backslash ambiguity. Dynamic identifiers remain one segment.
 */
export function safeRouteSegment(value: string, field = "route id"): string {
  const normalized = value.trim();
  if (!ROUTE_SEGMENT_PATTERN.test(normalized) || normalized === "." || normalized === "..") {
    throw new Error(`INVALID_${field.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`);
  }
  return encodeURIComponent(normalized);
}

export function bridgeStatusRoute(transferId: string): string {
  return `/bridge/status/${safeRouteSegment(transferId, "transfer id")}`;
}

export function claimStatusRoute(claimId: string): string {
  return `/claims/status/${safeRouteSegment(claimId, "claim id")}`;
}

export function stakingTransactionApiRoute(signature: string): string {
  return `/api/v1/staking/transactions/${safeRouteSegment(signature, "transaction signature")}`;
}
