import "server-only";
import { getSolanaRpc, getSuiRpc } from "../rpc/providers";
import type { RpcEndpointSnapshot } from "../rpc/endpoint-pool";
import type { JsonRpcMetrics, JsonRpcMeta } from "../rpc/json-rpc-client";

export type ProviderStatus = "healthy" | "degraded" | "unavailable";

export type ProviderHealth = {
  provider: "solana" | "sui";
  ok: boolean;
  status: ProviderStatus;
  latencyMs?: number;
  head?: string;
  stale?: boolean;
  source?: JsonRpcMeta["source"];
  error?: string;
  endpoints: RpcEndpointSnapshot[];
  poolCooldownRemainingMs: number;
  metrics: JsonRpcMetrics;
};

async function timed<T>(work: () => Promise<T>) {
  const started = performance.now();
  const value = await work();
  return { value, latencyMs: Math.round(performance.now() - started) };
}

function statusFromEndpoints(endpoints: RpcEndpointSnapshot[], requestOk: boolean, stale = false): ProviderStatus {
  if (!requestOk) return "unavailable";
  if (stale || endpoints.some((endpoint) => !endpoint.healthy || endpoint.circuit !== "closed" || endpoint.cooldownUntil > 0)) return "degraded";
  return "healthy";
}

function sanitizeError(error: unknown) {
  return error instanceof Error ? error.name : "Unavailable";
}

export async function checkProviderHealth(): Promise<{ ok: boolean; status: ProviderStatus; checkedAt: string; providers: ProviderHealth[] }> {
  const providers: ProviderHealth[] = [];

  try {
    const rpc = getSolanaRpc();
    const result = await timed(() => rpc.client.requestWithMeta<number>("getSlot", [{ commitment: "finalized" }], {
      timeoutMs: 4_000, cacheTtlMs: 1_000, staleIfErrorMs: 10_000,
    }));
    const endpoints = rpc.pool.snapshot();
    const status = statusFromEndpoints(endpoints, true, result.value.meta.stale);
    providers.push({
      provider: "solana", ok: true, status, latencyMs: result.latencyMs, head: String(result.value.value),
      stale: result.value.meta.stale, source: result.value.meta.source, endpoints,
      poolCooldownRemainingMs: rpc.pool.poolCooldownRemainingMs(), metrics: rpc.client.metrics(),
    });
  } catch (error) {
    let endpoints: ProviderHealth["endpoints"] = [];
    let poolCooldownRemainingMs = 0;
    let metrics = emptyMetrics();
    try { const rpc = getSolanaRpc(); endpoints = rpc.pool.snapshot(); poolCooldownRemainingMs = rpc.pool.poolCooldownRemainingMs(); metrics = rpc.client.metrics(); } catch {}
    providers.push({ provider: "solana", ok: false, status: "unavailable", error: sanitizeError(error), endpoints, poolCooldownRemainingMs, metrics });
  }

  try {
    const rpc = getSuiRpc();
    const result = await timed(() => rpc.client.requestWithMeta<string>("sui_getLatestCheckpointSequenceNumber", [], {
      timeoutMs: 4_000, cacheTtlMs: 1_000, staleIfErrorMs: 10_000,
    }));
    const endpoints = rpc.pool.snapshot();
    const status = statusFromEndpoints(endpoints, true, result.value.meta.stale);
    providers.push({
      provider: "sui", ok: true, status, latencyMs: result.latencyMs, head: String(result.value.value),
      stale: result.value.meta.stale, source: result.value.meta.source, endpoints,
      poolCooldownRemainingMs: rpc.pool.poolCooldownRemainingMs(), metrics: rpc.client.metrics(),
    });
  } catch (error) {
    let endpoints: ProviderHealth["endpoints"] = [];
    let poolCooldownRemainingMs = 0;
    let metrics = emptyMetrics();
    try { const rpc = getSuiRpc(); endpoints = rpc.pool.snapshot(); poolCooldownRemainingMs = rpc.pool.poolCooldownRemainingMs(); metrics = rpc.client.metrics(); } catch {}
    providers.push({ provider: "sui", ok: false, status: "unavailable", error: sanitizeError(error), endpoints, poolCooldownRemainingMs, metrics });
  }

  const status: ProviderStatus = providers.some((provider) => provider.status === "unavailable")
    ? "unavailable"
    : providers.some((provider) => provider.status === "degraded") ? "degraded" : "healthy";
  return { ok: status !== "unavailable", status, checkedAt: new Date().toISOString(), providers };
}

function redundancy(endpoints: RpcEndpointSnapshot[]) {
  const available = endpoints.filter((endpoint) => endpoint.circuit !== "open" && endpoint.cooldownUntil <= 0).length;
  return available >= 2 ? "full" : available === 1 ? "reduced" : "none";
}

export async function checkProviderReadiness() {
  const checks = await Promise.allSettled([
    timed(() => getSolanaRpc().client.requestWithMeta<number>("getSlot", [{ commitment: "finalized" }], { timeoutMs: 4_000, requestBudgetMs: 5_000, cacheTtlMs: 0, staleIfErrorMs: 0, dedupe: false })),
    timed(() => getSuiRpc().client.requestWithMeta<string>("sui_getLatestCheckpointSequenceNumber", [], { timeoutMs: 4_000, requestBudgetMs: 5_000, cacheTtlMs: 0, staleIfErrorMs: 0, dedupe: false })),
  ]);
  const chains = ["solana", "sui"] as const;
  const runtimes = [getSolanaRpc, getSuiRpc];
  const providers = checks.map((entry, index) => {
    let endpoints: RpcEndpointSnapshot[] = [];
    try { endpoints = runtimes[index]().pool.snapshot(); } catch {}
    const redundancyState = redundancy(endpoints);
    return entry.status === "fulfilled"
      ? { provider: chains[index], ready: !entry.value.value.meta.stale, redundancy: redundancyState, latencyMs: entry.value.latencyMs, head: String(entry.value.value.value) }
      : { provider: chains[index], ready: false, redundancy: redundancyState, error: sanitizeError(entry.reason) };
  });
  const ready = providers.every((provider) => provider.ready);
  const degraded = ready && providers.some((provider) => provider.redundancy !== "full");
  return { ready, degraded, checkedAt: new Date().toISOString(), providers };
}

function emptyMetrics(): JsonRpcMetrics {
  return { requests: 0, networkRequests: 0, cacheHits: 0, staleCacheHits: 0, dedupeHits: 0, rateLimited: 0, failures: 0, failovers: 0, active: 0, maxActive: 0, rejectedByConcurrency: 0, cacheEvictions: 0, cacheInvalidations: 0, budgetTimeouts: 0, quorumChecks: 0, quorumDisagreements: 0, hedgedRequests: 0, hedgeFallbackWins: 0 };
}
