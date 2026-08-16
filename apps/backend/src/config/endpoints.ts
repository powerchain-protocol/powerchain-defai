import { solanaClusterDefinition, type SolanaNetworkName } from "@powerchain/clusters";
import type { EndpointDefinition, EndpointPool } from "../types/endpoints";
import { providerUrls } from "./provider-urls";

function value(env: NodeJS.ProcessEnv, name: string) {
  return env[name]?.trim() || undefined;
}

function urls(env: NodeJS.ProcessEnv, name: string) {
  return (value(env, name) ?? "").split(",").map((entry) => entry.trim()).filter(Boolean);
}

function endpoint(
  id: string,
  provider: string,
  kind: EndpointDefinition["kind"],
  role: EndpointDefinition["role"],
  url: string,
  secret = false,
): EndpointDefinition {
  return { id, provider, kind, role, url, secret };
}

function heliusHost(network: SolanaNetworkName) {
  if (network === "mainnet-beta") return "mainnet.helius-rpc.com";
  if (network === "devnet") return "devnet.helius-rpc.com";
  // Helius does not provide a canonical testnet/localnet endpoint. Require an explicit endpoint.
  return null;
}

export function heliusRpcUrl(env: NodeJS.ProcessEnv = process.env) {
  const direct = value(env, "POWERCHAIN_SOLANA_RPC_URL");
  if (direct) return direct;
  const key = value(env, "HELIUS_API_KEY");
  const host = heliusHost(solanaClusterDefinition(env.POWERCHAIN_SOLANA_NETWORK).network);
  return key && host ? `https://${host}/?api-key=${encodeURIComponent(key)}` : undefined;
}

export function heliusWsUrl(env: NodeJS.ProcessEnv = process.env) {
  const direct = value(env, "POWERCHAIN_SOLANA_WS_URL");
  if (direct) return direct;
  const key = value(env, "HELIUS_API_KEY");
  const host = heliusHost(solanaClusterDefinition(env.POWERCHAIN_SOLANA_NETWORK).network);
  return key && host ? `wss://${host}/?api-key=${encodeURIComponent(key)}` : undefined;
}

function endpointPool(
  kind: "rpc" | "websocket",
  primary: string | undefined,
  fallbacks: string[],
  provider: string,
): EndpointPool {
  return {
    primary: primary ? endpoint(`solana-${kind === "websocket" ? "ws" : kind}-primary`, provider, kind, "primary", primary, true) : undefined,
    fallbacks: fallbacks.map((url, index) => endpoint(`solana-${kind === "websocket" ? "ws" : kind}-fallback-${index + 1}`, "fallback", kind, "fallback", url, true)),
  };
}

export function solanaRpcPool(env: NodeJS.ProcessEnv = process.env): EndpointPool {
  const primary = heliusRpcUrl(env);
  const fallbacks = [value(env, "POWERCHAIN_SOLANA_RPC_FALLBACK_URL"), ...urls(env, "POWERCHAIN_SOLANA_RPC_FALLBACK_URLS")]
    .filter((entry): entry is string => Boolean(entry));
  return endpointPool("rpc", primary, fallbacks, value(env, "HELIUS_API_KEY") && !value(env, "POWERCHAIN_SOLANA_RPC_URL") ? "helius" : "custom");
}

export function solanaWsPool(env: NodeJS.ProcessEnv = process.env): EndpointPool {
  const primary = heliusWsUrl(env);
  const fallbacks = [value(env, "POWERCHAIN_SOLANA_WS_FALLBACK_URL"), ...urls(env, "POWERCHAIN_SOLANA_WS_FALLBACK_URLS")]
    .filter((entry): entry is string => Boolean(entry));
  return endpointPool("websocket", primary, fallbacks, value(env, "HELIUS_API_KEY") && !value(env, "POWERCHAIN_SOLANA_WS_URL") ? "helius" : "custom");
}

export function suiGrpcPool(env: NodeJS.ProcessEnv = process.env): EndpointPool {
  const primary = value(env, "POWERCHAIN_SUI_GRPC_URL");
  const fallbacks = [value(env, "POWERCHAIN_SUI_GRPC_FALLBACK_URL"), ...urls(env, "POWERCHAIN_SUI_GRPC_FALLBACK_URLS")]
    .filter((entry): entry is string => Boolean(entry));
  return {
    primary: primary ? endpoint("sui-grpc-primary", "sui", "grpc", "primary", primary, true) : undefined,
    fallbacks: fallbacks.map((url, index) => endpoint(`sui-grpc-fallback-${index + 1}`, "sui", "grpc", "fallback", url, true)),
  };
}

export function integrationEndpoints(env: NodeJS.ProcessEnv = process.env) {
  return {
    jupiter: providerUrls(env).jupiterV2,
    birdeye: providerUrls(env).birdeye,
    coinmarketcap: providerUrls(env).coinmarketcap,
    coingecko: providerUrls(env).coingeckoPro,
    dexscreener: value(env, "POWERCHAIN_DEXSCREENER_API_URL") || "https://api.dexscreener.com",
    raydium: providerUrls(env).raydium,
    meteora: value(env, "POWERCHAIN_METEORA_API_URL") || "https://dlmm.datapi.meteora.ag",
    orca: value(env, "POWERCHAIN_ORCA_API_URL") || "https://api.orca.so/v2/solana",
    cetus: value(env, "POWERCHAIN_CETUS_API_URL") || "",
    tensor: value(env, "POWERCHAIN_TENSOR_API_URL") || "",
  } as const;
}
