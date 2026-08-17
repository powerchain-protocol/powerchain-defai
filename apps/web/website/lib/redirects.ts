import { appUrl } from "./urls";

export const APP_ROUTE_SLUGS = [
  "dashboard",
  "chat",
  "swap",
  "bridge",
  "bridge-status",
  "staking",
  "wallet",
  "assets",
  "claim",
  "claim-status",
  "history",
  "fees",
  "explorer",
  "protocol",
  "integrations",
  "status",
  "profile",
  "settings",
] as const;

export type AppRouteSlug = (typeof APP_ROUTE_SLUGS)[number];
export type HandoffChain = "SOLANA" | "SUI";

const STATIC_ROUTES: Partial<Record<AppRouteSlug, string>> = {
  dashboard: "/",
  chat: "/chat",
  swap: "/swap",
  bridge: "/bridge",
  staking: "/staking",
  wallet: "/wallet",
  assets: "/assets",
  claim: "/claim",
  history: "/history",
  fees: "/fees",
  explorer: "/explorer",
  protocol: "/protocol",
  integrations: "/integrations",
  status: "/status",
  profile: "/profile",
  settings: "/settings",
};

const SAFE_ID = /^[A-Za-z0-9_-]{1,180}$/;
const SAFE_CLUSTER = /^(solana|sui):(mainnet|testnet|devnet|localnet)$/;

export function isAppRouteSlug(value: string): value is AppRouteSlug {
  return (APP_ROUTE_SLUGS as readonly string[]).includes(value);
}

export function sanitizeResourceId(value?: string | null) {
  const candidate = value?.trim() ?? "";
  return SAFE_ID.test(candidate) ? candidate : null;
}

export function resolveAppPath(slug: string, id?: string | null) {
  if (!isAppRouteSlug(slug)) return null;
  if (slug === "bridge-status") {
    const safeId = sanitizeResourceId(id);
    return safeId ? `/bridge/status/${encodeURIComponent(safeId)}` : "/bridge";
  }
  if (slug === "claim-status") {
    const safeId = sanitizeResourceId(id);
    return safeId ? `/claims/status/${encodeURIComponent(safeId)}` : "/claim";
  }
  return STATIC_ROUTES[slug] ?? "/";
}

export function buildAppHandoffUrl({
  slug,
  id,
  chain,
  clusterId,
  source = "website",
}: {
  slug: string;
  id?: string | null;
  chain?: HandoffChain | null;
  clusterId?: string | null;
  source?: string;
}) {
  const path = resolveAppPath(slug, id) ?? "/";
  const url = new URL(appUrl(path));
  url.searchParams.set("source", source);
  if (chain === "SOLANA" || chain === "SUI") url.searchParams.set("chain", chain.toLowerCase());
  if (clusterId && SAFE_CLUSTER.test(clusterId)) url.searchParams.set("cluster", clusterId);
  return url.toString();
}
