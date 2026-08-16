export type BlockchainChain = "SOLANA" | "SUI";
export type NetworkEnvironment = "mainnet" | "testnet" | "devnet" | "localnet";
export type SolanaClusterName = "mainnet-beta" | "testnet" | "devnet" | "localnet";
export type SuiNetworkName = "mainnet" | "testnet" | "devnet" | "localnet";
export type ClusterName = SolanaClusterName | SuiNetworkName;
export type ClusterId =
  | "solana:mainnet"
  | "solana:testnet"
  | "solana:devnet"
  | "solana:localnet"
  | "sui:mainnet"
  | "sui:testnet"
  | "sui:devnet"
  | "sui:localnet";

export type ClusterDefinition = {
  id: ClusterId;
  chain: BlockchainChain;
  environment: NetworkEnvironment;
  network: ClusterName;
  production: boolean;
  nativeSymbol: "SOL" | "SUI";
  rpcTransport: "json-rpc" | "grpc-core";
  realtimeTransport: "websocket" | "grpc-stream";
};

const CLUSTERS = {
  "solana:mainnet": { id: "solana:mainnet", chain: "SOLANA", environment: "mainnet", network: "mainnet-beta", production: true, nativeSymbol: "SOL", rpcTransport: "json-rpc", realtimeTransport: "websocket" },
  "solana:testnet": { id: "solana:testnet", chain: "SOLANA", environment: "testnet", network: "testnet", production: false, nativeSymbol: "SOL", rpcTransport: "json-rpc", realtimeTransport: "websocket" },
  "solana:devnet": { id: "solana:devnet", chain: "SOLANA", environment: "devnet", network: "devnet", production: false, nativeSymbol: "SOL", rpcTransport: "json-rpc", realtimeTransport: "websocket" },
  "solana:localnet": { id: "solana:localnet", chain: "SOLANA", environment: "localnet", network: "localnet", production: false, nativeSymbol: "SOL", rpcTransport: "json-rpc", realtimeTransport: "websocket" },
  "sui:mainnet": { id: "sui:mainnet", chain: "SUI", environment: "mainnet", network: "mainnet", production: true, nativeSymbol: "SUI", rpcTransport: "grpc-core", realtimeTransport: "grpc-stream" },
  "sui:testnet": { id: "sui:testnet", chain: "SUI", environment: "testnet", network: "testnet", production: false, nativeSymbol: "SUI", rpcTransport: "grpc-core", realtimeTransport: "grpc-stream" },
  "sui:devnet": { id: "sui:devnet", chain: "SUI", environment: "devnet", network: "devnet", production: false, nativeSymbol: "SUI", rpcTransport: "grpc-core", realtimeTransport: "grpc-stream" },
  "sui:localnet": { id: "sui:localnet", chain: "SUI", environment: "localnet", network: "localnet", production: false, nativeSymbol: "SUI", rpcTransport: "grpc-core", realtimeTransport: "grpc-stream" },
} as const satisfies Record<ClusterId, ClusterDefinition>;

export const POWERCHAIN_CLUSTERS: readonly ClusterDefinition[] = Object.freeze(Object.values(CLUSTERS));
export const DEFAULT_SOLANA_CLUSTER: SolanaClusterName = "mainnet-beta";
export const DEFAULT_SUI_NETWORK: SuiNetworkName = "mainnet";

export function clusterById(id: ClusterId): ClusterDefinition { return CLUSTERS[id]; }
export function clustersForChain(chain: BlockchainChain): readonly ClusterDefinition[] { return POWERCHAIN_CLUSTERS.filter((cluster) => cluster.chain === chain); }

export function parseSolanaCluster(value: unknown): SolanaClusterName {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "mainnet" || normalized === "mainnet-beta") return "mainnet-beta";
  if (normalized === "testnet" || normalized === "devnet" || normalized === "localnet") return normalized;
  return DEFAULT_SOLANA_CLUSTER;
}

export function parseSuiNetwork(value: unknown): SuiNetworkName {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "mainnet" || normalized === "testnet" || normalized === "devnet" || normalized === "localnet") return normalized;
  return DEFAULT_SUI_NETWORK;
}

export function solanaClusterDefinition(value: unknown): ClusterDefinition {
  const network = parseSolanaCluster(value);
  const environment: NetworkEnvironment = network === "mainnet-beta" ? "mainnet" : network;
  return clusterById(`solana:${environment}` as ClusterId);
}

export function suiClusterDefinition(value: unknown): ClusterDefinition {
  const network = parseSuiNetwork(value);
  return clusterById(`sui:${network}` as ClusterId);
}
