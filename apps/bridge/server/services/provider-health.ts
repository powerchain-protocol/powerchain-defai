import "server-only";
import { getSolanaRpc } from "../rpc/providers";
import { powerChainSuiGrpcUrls, probePowerChainSuiGrpc } from "@powerchain/backend";
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
  source?: JsonRpcMeta["source"] | "grpc";
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

function suiGrpcSnapshots(probes: Array<{ endpointIndex: number; ok: boolean; latencyMs: number }>): RpcEndpointSnapshot[] {
  return probes.map((probe) => ({
    id: `sui-grpc-${probe.endpointIndex + 1}`,
    priority: probe.endpointIndex,
    healthy: probe.ok,
    circuit: probe.ok ? "closed" as const : "open" as const,
    consecutiveFailures: probe.ok ? 0 : 1,
    cooldownUntil: 0,
    activeRequests: 0,
    ...(probe.ok ? { lastLatencyMs: probe.latencyMs, ewmaLatencyMs: probe.latencyMs, lastSuccessAt: Date.now() } : {}),
    successes: probe.ok ? 1 : 0,
    failures: probe.ok ? 0 : 1,
  }));
}

function configuredSuiGrpcCount() {
  try { return powerChainSuiGrpcUrls().length; } catch { return 0; }
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
    const result = await timed(() => probePowerChainSuiGrpc());
    const endpoints = suiGrpcSnapshots(result.value.endpoints);
    const status = result.value.healthyEndpointCount >= 2 ? "healthy" : "degraded";
    providers.push({
      provider: "sui", ok: true, status, latencyMs: result.latencyMs, head: undefined,
      stale: false, source: "grpc", endpoints, poolCooldownRemainingMs: 0, metrics: emptyMetrics(),
    });
  } catch (error) {
    const endpointCount = configuredSuiGrpcCount();
    providers.push({
      provider: "sui", ok: false, status: "unavailable", error: sanitizeError(error),
      endpoints: Array.from({ length: endpointCount }, (_, index) => ({ id: `sui-grpc-${index + 1}`, priority: index, healthy: false, circuit: "open" as const, consecutiveFailures: 1, cooldownUntil: 0, activeRequests: 0, successes: 0, failures: 1 })), poolCooldownRemainingMs: 0, metrics: emptyMetrics(),
    });
  }

  const status: ProviderStatus = providers.some((provider) => provider.status === "unavailable")
    ? "unavailable"
    : providers.some((provider) => provider.status === "degraded") ? "degraded" : "healthy";
  return { ok: status !== "unavailable", status, checkedAt: new Date().toISOString(), providers };
}

function redundancy(endpoints: RpcEndpointSnapshot[]) {
  const available = endpoints.filter((endpoint) => endpoint.healthy && endpoint.circuit === "closed" && endpoint.cooldownUntil <= 0).length;
  return available >= 2 ? "full" : available === 1 ? "reduced" : "none";
}

export async function checkProviderReadiness() {
  const checks = await Promise.allSettled([
    timed(() => getSolanaRpc().client.requestWithMeta<number>("getSlot", [{ commitment: "finalized" }], { timeoutMs: 4_000, requestBudgetMs: 5_000, cacheTtlMs: 0, staleIfErrorMs: 0, dedupe: false })),
    timed(() => probePowerChainSuiGrpc()),
  ]);

  const solanaEndpoints = (() => { try { return getSolanaRpc().pool.snapshot(); } catch { return [] as RpcEndpointSnapshot[]; } })();
  const suiEndpointCount = configuredSuiGrpcCount();

  const solana = checks[0];
  const sui = checks[1];
  const providers = [
    solana.status === "fulfilled"
      ? { provider: "solana" as const, ready: !solana.value.value.meta.stale, redundancy: redundancy(solanaEndpoints), latencyMs: solana.value.latencyMs, head: String(solana.value.value.value) }
      : { provider: "solana" as const, ready: false, redundancy: redundancy(solanaEndpoints), error: sanitizeError(solana.reason) },
    sui.status === "fulfilled"
      ? { provider: "sui" as const, ready: sui.value.value.healthyEndpointCount > 0, redundancy: sui.value.value.healthyEndpointCount >= 2 ? "full" as const : sui.value.value.healthyEndpointCount === 1 ? "reduced" as const : "none" as const, latencyMs: sui.value.latencyMs, head: undefined }
      : { provider: "sui" as const, ready: false, redundancy: "none" as const, configuredEndpoints: suiEndpointCount, error: sanitizeError(sui.reason) },
  ];
  const ready = providers.every((provider) => provider.ready);
  const degraded = ready && providers.some((provider) => provider.redundancy !== "full");
  return { ready, degraded, checkedAt: new Date().toISOString(), providers };
}


function emptyMetrics(): JsonRpcMetrics {
  return { requests: 0, networkRequests: 0, cacheHits: 0, staleCacheHits: 0, dedupeHits: 0, rateLimited: 0, failures: 0, failovers: 0, active: 0, maxActive: 0, rejectedByConcurrency: 0, cacheEvictions: 0, cacheInvalidations: 0, budgetTimeouts: 0, quorumChecks: 0, quorumDisagreements: 0, hedgedRequests: 0, hedgeFallbackWins: 0 };
}
