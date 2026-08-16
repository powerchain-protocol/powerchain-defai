import { SuiGrpcClient } from "@mysten/sui/grpc";
import { parseSuiNetwork, type SuiNetworkName } from "@powerchain/clusters";

export type PowerChainSuiNetwork = SuiNetworkName;

export function powerChainSuiNetwork(env: NodeJS.ProcessEnv = process.env): PowerChainSuiNetwork {
  return parseSuiNetwork(env.POWERCHAIN_SUI_NETWORK ?? env.SUI_NETWORK ?? env.POWERCHAIN_WORMHOLE_NETWORK);
}

function csv(value: string | undefined): string[] {
  return (value ?? "").split(",").map((item) => item.trim()).filter(Boolean);
}

function uniqueUrls(values: Array<string | undefined>): string[] {
  const result: string[] = [];
  for (const value of values) {
    if (!value) continue;
    for (const candidate of csv(value)) {
      const url = new URL(candidate);
      if (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && url.protocol === "http:")) {
        throw new Error("POWERCHAIN_SUI_GRPC_URL_INVALID");
      }
      const normalized = url.toString().replace(/\/$/, "");
      if (!result.includes(normalized)) result.push(normalized);
    }
  }
  return result;
}

/**
 * Ordered Sui gRPC endpoints. Explicit gRPC variables are preferred; the older
 * RPC variables remain a development compatibility fallback while providers
 * complete their gRPC migration.
 */
export function powerChainSuiGrpcUrls(env: NodeJS.ProcessEnv = process.env): string[] {
  const urls = uniqueUrls([
    env.POWERCHAIN_SUI_GRPC_URL,
    env.POWERCHAIN_SUI_GRPC_FALLBACK_URL,
    env.POWERCHAIN_SUI_GRPC_FALLBACK_URLS,
    env.POWERCHAIN_SUI_RPC_URL,
    env.SUI_RPC,
    env.POWERCHAIN_SUI_RPC_FALLBACK_URL,
  ]);
  if (!urls.length) throw new Error("POWERCHAIN_SUI_GRPC_URL_REQUIRED");
  return urls;
}

export function createPowerChainSuiClient(env: NodeJS.ProcessEnv = process.env): SuiGrpcClient {
  return new SuiGrpcClient({ network: powerChainSuiNetwork(env), baseUrl: powerChainSuiGrpcUrls(env)[0]! });
}

/** Retry read/finality operations across independent gRPC endpoints. */
export async function withPowerChainSuiClient<T>(
  run: (client: SuiGrpcClient, endpoint: string) => Promise<T>,
  env: NodeJS.ProcessEnv = process.env,
): Promise<T> {
  const network = powerChainSuiNetwork(env);
  const endpoints = powerChainSuiGrpcUrls(env);
  const errors: string[] = [];
  for (const endpoint of endpoints) {
    try {
      return await run(new SuiGrpcClient({ network, baseUrl: endpoint }), endpoint);
    } catch (error) {
      errors.push(error instanceof Error ? error.name : "SUI_GRPC_FAILED");
    }
  }
  throw new Error(`SUI_GRPC_UNAVAILABLE:${errors.join(",") || "unknown"}`);
}

export type PowerChainSuiGrpcEndpointProbe = {
  endpointIndex: number;
  ok: boolean;
  latencyMs: number;
  referenceGasPrice?: string;
  error?: string;
};

export type PowerChainSuiGrpcProbe = {
  endpointIndex: number;
  endpointCount: number;
  healthyEndpointCount: number;
  referenceGasPrice: string;
  checkedAt: string;
  endpoints: PowerChainSuiGrpcEndpointProbe[];
};

/**
 * Probe every configured Sui gRPC endpoint independently. Redundancy is based
 * on endpoints that actually respond, not merely on the number of URLs present
 * in environment configuration.
 */
export async function probePowerChainSuiGrpc(env: NodeJS.ProcessEnv = process.env): Promise<PowerChainSuiGrpcProbe> {
  const endpoints = powerChainSuiGrpcUrls(env);
  const network = powerChainSuiNetwork(env);
  const probes = await Promise.all(endpoints.map(async (endpoint, endpointIndex): Promise<PowerChainSuiGrpcEndpointProbe> => {
    const started = performance.now();
    try {
      const client = new SuiGrpcClient({ network, baseUrl: endpoint });
      const { referenceGasPrice } = await client.core.getReferenceGasPrice();
      return {
        endpointIndex,
        ok: true,
        latencyMs: Math.round(performance.now() - started),
        referenceGasPrice: String(referenceGasPrice),
      };
    } catch (error) {
      return {
        endpointIndex,
        ok: false,
        latencyMs: Math.round(performance.now() - started),
        error: error instanceof Error ? error.name : "SUI_GRPC_PROBE_FAILED",
      };
    }
  }));
  const healthy = probes.filter((probe) => probe.ok && probe.referenceGasPrice !== undefined);
  const selected = healthy[0];
  if (!selected?.referenceGasPrice) {
    const errors = probes.map((probe) => probe.error ?? "SUI_GRPC_PROBE_FAILED");
    throw new Error(`SUI_GRPC_UNAVAILABLE:${errors.join(",") || "unknown"}`);
  }
  return {
    endpointIndex: selected.endpointIndex,
    endpointCount: endpoints.length,
    healthyEndpointCount: healthy.length,
    referenceGasPrice: selected.referenceGasPrice,
    checkedAt: new Date().toISOString(),
    endpoints: probes,
  };
}

export type PowerChainSuiBalance = {
  balanceBaseUnits: string;
  coinBalanceBaseUnits: string;
  addressBalanceBaseUnits: string;
};

/** Read the combined Sui balance model through the current Core API with failover. */
export async function getPowerChainSuiBalance(
  owner: string,
  coinType?: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<PowerChainSuiBalance> {
  return withPowerChainSuiClient(async (client) => {
    const { balance } = await client.core.getBalance({
      owner,
      ...(coinType ? { coinType } : {}),
    });
    return {
      balanceBaseUnits: String(balance.balance),
      coinBalanceBaseUnits: String(balance.coinBalance),
      addressBalanceBaseUnits: String(balance.addressBalance),
    };
  }, env);
}
