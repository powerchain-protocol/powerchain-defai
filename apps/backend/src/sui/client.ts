import { SuiGrpcClient } from "@mysten/sui/grpc";

export type PowerChainSuiNetwork = "mainnet" | "testnet" | "devnet" | "localnet";

export function powerChainSuiNetwork(env: NodeJS.ProcessEnv = process.env): PowerChainSuiNetwork {
  const raw = (env.POWERCHAIN_SUI_NETWORK ?? env.POWERCHAIN_WORMHOLE_NETWORK ?? "mainnet").trim().toLowerCase();
  if (raw === "testnet" || raw === "devnet" || raw === "localnet") return raw;
  return "mainnet";
}

export function createPowerChainSuiClient(env: NodeJS.ProcessEnv = process.env): SuiGrpcClient {
  const network = powerChainSuiNetwork(env);
  const baseUrl = env.POWERCHAIN_SUI_GRPC_URL?.trim() || env.POWERCHAIN_SUI_RPC_URL?.trim() || env.SUI_RPC_URL?.trim();
  if (!baseUrl) throw new Error("POWERCHAIN_SUI_GRPC_URL_REQUIRED");
  return new SuiGrpcClient({ network, baseUrl });
}
