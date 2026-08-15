export type ProviderStatus = "healthy" | "degraded" | "unavailable";
export type ProviderHealthItem = {
  provider: "solana" | "sui";
  ok: boolean;
  status: ProviderStatus;
  latencyMs?: number;
  head?: string;
  stale?: boolean;
  error?: string;
};
export type ProviderHealthPayload = {
  ok: boolean;
  status: ProviderStatus;
  checkedAt: string;
  providers: ProviderHealthItem[];
};
export type ProviderReadinessPayload = {
  ready: boolean;
  checkedAt: string;
  redundancy?: "full" | "reduced" | "none";
};

const statuses = new Set<ProviderStatus>(["healthy", "degraded", "unavailable"]);

export function isProviderHealthPayload(value: unknown): value is ProviderHealthPayload {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  if (typeof item.ok !== "boolean" || !statuses.has(item.status as ProviderStatus) || typeof item.checkedAt !== "string") return false;
  if (!Number.isFinite(Date.parse(item.checkedAt)) || !Array.isArray(item.providers)) return false;
  return item.providers.every((provider) => {
    if (!provider || typeof provider !== "object") return false;
    const p = provider as Record<string, unknown>;
    return (p.provider === "solana" || p.provider === "sui") && typeof p.ok === "boolean" && statuses.has(p.status as ProviderStatus);
  });
}

export function isProviderReadinessPayload(value: unknown): value is ProviderReadinessPayload {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  if (typeof item.ready !== "boolean" || typeof item.checkedAt !== "string" || !Number.isFinite(Date.parse(item.checkedAt))) return false;
  return item.redundancy === undefined || item.redundancy === "full" || item.redundancy === "reduced" || item.redundancy === "none";
}

export function ageMs(iso: string | undefined, now = Date.now()) {
  if (!iso) return Number.POSITIVE_INFINITY;
  const parsed = Date.parse(iso);
  return Number.isFinite(parsed) ? Math.max(0, now - parsed) : Number.POSITIVE_INFINITY;
}
