import { solanaRpcPool, solanaWsPool, suiGrpcPool } from "../config/endpoints";
import { withPowerChainSuiClient } from "../sui/client";
import { solanaConfig } from "../config/solana";
import { suiConfig } from "../config/sui";
import { createSolanaRpc, type BlockchainChain } from "@powerchain/blockchain";

export type RpcChain = BlockchainChain;
export type RpcEndpointHealth = { id: string; chain: RpcChain; role: "primary" | "fallback"; ok: boolean; latencyMs: number; error?: string };
export type RpcRuntimeStatus = { checkedAt: string; activeClusters: { solana: string; sui: string }; solana: RpcEndpointHealth[]; sui: RpcEndpointHealth[]; authoritativeForBridgeAccounting: false };

const DEFAULT_RPC_TIMEOUT_MS = 10_000;
function timeoutMs() { const value = Number(process.env.POWERCHAIN_RPC_TIMEOUT_MS ?? DEFAULT_RPC_TIMEOUT_MS); return Number.isFinite(value) ? Math.max(1_000, Math.min(value, 30_000)) : DEFAULT_RPC_TIMEOUT_MS; }
function safeError(error: unknown) { return error instanceof Error ? error.message.slice(0, 120) : "RPC_FAILED"; }

function endpointUrls(pool: ReturnType<typeof solanaRpcPool>): string[] {
  const endpoints = [pool.primary, ...pool.fallbacks].filter((value): value is NonNullable<typeof value> => Boolean(value));
  const urls: string[] = [];
  for (const endpoint of endpoints) {
    const parsed = new URL(endpoint.url);
    const isHttp = parsed.protocol === "https:" || (process.env.NODE_ENV !== "production" && parsed.protocol === "http:");
    const isWebSocket = parsed.protocol === "wss:" || (process.env.NODE_ENV !== "production" && parsed.protocol === "ws:");
    if (!isHttp && !isWebSocket) throw new Error("SOLANA_ENDPOINT_URL_INVALID");
    const normalized = parsed.toString().replace(/\/$/, "");
    if (!urls.includes(normalized)) urls.push(normalized);
  }
  return urls;
}

export function solanaRpcUrls(): string[] {
  const urls = endpointUrls(solanaRpcPool());
  if (!urls.length) throw new Error("POWERCHAIN_SOLANA_RPC_URL_REQUIRED");
  return urls;
}

export function solanaWebSocketUrls(): string[] {
  return endpointUrls(solanaWsPool());
}

export async function solanaRpcRequest<T>(method: string, params: readonly unknown[] = []): Promise<T> {
  const attempts: string[] = [];
  for (const url of solanaRpcUrls()) {
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), timeoutMs());
    try {
      const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }), signal: controller.signal, cache: "no-store" });
      if (!response.ok) throw new Error(`RPC_HTTP_${response.status}`);
      const body = await response.json() as { result?: T; error?: { message?: string } };
      if (body.error) throw new Error(`RPC_ERROR:${body.error.message ?? "unknown"}`);
      if (body.result === undefined) throw new Error("RPC_RESULT_MISSING");
      return body.result;
    } catch (error) { attempts.push(safeError(error)); }
    finally { clearTimeout(timer); }
  }
  throw new Error(`SOLANA_RPC_UNAVAILABLE:${attempts.join("|")}`);
}

async function probeSolanaEndpoint(id: string, role: "primary" | "fallback", url: string): Promise<RpcEndpointHealth> {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.min(timeoutMs(), 6_000));
  try {
    const result = await createSolanaRpc(url).getHealth().send({ abortSignal: controller.signal });
    const ok = result === "ok";
    return { id, chain: "SOLANA", role, ok, latencyMs: Date.now() - started, ...(ok ? {} : { error: "RPC_HEALTH_NOT_OK" }) };
  } catch (error) {
    return { id, chain: "SOLANA", role, ok: false, latencyMs: Date.now() - started, error: safeError(error) };
  } finally {
    clearTimeout(timer);
  }
}

export async function rpcRuntimeStatus(): Promise<RpcRuntimeStatus> {
  const solanaPool = solanaRpcPool(); const suiPool = suiGrpcPool();
  const solanaEndpoints = [solanaPool.primary, ...solanaPool.fallbacks].filter((value): value is NonNullable<typeof value> => Boolean(value));
  const suiEndpoints = [suiPool.primary, ...suiPool.fallbacks].filter((value): value is NonNullable<typeof value> => Boolean(value));
  const solana = await Promise.all(solanaEndpoints.map((endpoint) => probeSolanaEndpoint(endpoint.id, endpoint.role, endpoint.url)));
  const sui = await Promise.all(suiEndpoints.map(async (endpoint): Promise<RpcEndpointHealth> => {
    const started = Date.now();
    try {
      const scopedEnv: NodeJS.ProcessEnv = { ...process.env, POWERCHAIN_SUI_GRPC_URL: endpoint.url, POWERCHAIN_SUI_GRPC_FALLBACK_URL: "", POWERCHAIN_SUI_GRPC_FALLBACK_URLS: "", POWERCHAIN_SUI_RPC_URL: "", POWERCHAIN_SUI_RPC_FALLBACK_URL: "" };
      await withPowerChainSuiClient((client) => client.core.getReferenceGasPrice(), scopedEnv);
      return { id: endpoint.id, chain: "SUI", role: endpoint.role, ok: true, latencyMs: Date.now() - started };
    } catch (error) { return { id: endpoint.id, chain: "SUI", role: endpoint.role, ok: false, latencyMs: Date.now() - started, error: safeError(error) }; }
  }));
  const solanaRuntime = solanaConfig(); const suiRuntime = suiConfig();
  return { checkedAt: new Date().toISOString(), activeClusters: { solana: solanaRuntime.cluster.id, sui: suiRuntime.cluster.id }, solana, sui, authoritativeForBridgeAccounting: false };
}
