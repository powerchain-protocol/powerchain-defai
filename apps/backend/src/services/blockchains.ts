import { CROSS_CHAIN_PAIRS, POWERCHAIN_CLUSTERS, solanaClusterDefinition, suiClusterDefinition, type BlockchainChain } from "@powerchain/blockchain";
import { officialSolanaPrograms } from "../config/solana-programs";

export type BlockchainRuntimeDefinition = {
  chain: BlockchainChain;
  name: "Solana" | "Sui";
  nativeSymbol: "SOL" | "SUI";
  clusterId: string;
  network: string;
  environment: string;
  production: boolean;
  transport: { read: string; realtime: string };
};

export function blockchainRuntimeDefinitions(env: NodeJS.ProcessEnv = process.env): readonly BlockchainRuntimeDefinition[] {
  const solana = solanaClusterDefinition(env.POWERCHAIN_SOLANA_NETWORK);
  const sui = suiClusterDefinition(env.POWERCHAIN_SUI_NETWORK ?? env.SUI_NETWORK);
  return Object.freeze([
    { chain: "SOLANA", name: "Solana", nativeSymbol: "SOL", clusterId: solana.id, network: solana.network, environment: solana.environment, production: solana.production, transport: { read: "JSON-RPC", realtime: "WebSocket" } },
    { chain: "SUI", name: "Sui", nativeSymbol: "SUI", clusterId: sui.id, network: sui.network, environment: sui.environment, production: sui.production, transport: { read: "gRPC Core", realtime: "gRPC stream" } },
  ]);
}

export function publicClusterRegistry() {
  return {
    active: blockchainRuntimeDefinitions(),
    officialSolanaPrograms: officialSolanaPrograms(),
    supported: POWERCHAIN_CLUSTERS,
    crossChainPairs: CROSS_CHAIN_PAIRS,
    principalMovementProtocol: "wormhole-ntt" as const,
    authoritativeForBridgeAccounting: false as const,
  };
}
