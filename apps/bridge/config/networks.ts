import { POWERCHAIN_SOLANA_BRIDGE_PROGRAM_ID } from "@powerchain/protocol";
import { solanaClusterDefinition, suiClusterDefinition } from "@powerchain/clusters";

const solana = solanaClusterDefinition(process.env.NEXT_PUBLIC_POWERCHAIN_SOLANA_NETWORK ?? process.env.POWERCHAIN_SOLANA_NETWORK);
const sui = suiClusterDefinition(process.env.NEXT_PUBLIC_POWERCHAIN_SUI_NETWORK ?? process.env.POWERCHAIN_SUI_NETWORK);

export const SOLANA_CONFIG = {
  id: "solana",
  chain: "SOLANA",
  name: "Solana",
  clusterId: solana.id,
  network: solana.network,
  nativeSymbol: "SOL",
  bridgeProgramId: POWERCHAIN_SOLANA_BRIDGE_PROGRAM_ID,
  transport: { read: "JSON-RPC", realtime: "WebSocket" },
} as const;

export const SUI_CONFIG = {
  id: "sui",
  chain: "SUI",
  name: "Sui",
  clusterId: sui.id,
  network: sui.network,
  nativeSymbol: "SUI",
  transport: { read: "gRPC Core", realtime: "gRPC streaming" },
} as const;

export const POWERCHAIN_NETWORKS = [SOLANA_CONFIG, SUI_CONFIG] as const;
