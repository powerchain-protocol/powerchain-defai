import { solanaClusterDefinition } from "@powerchain/clusters";
import { solanaRpcPool, solanaWsPool } from "./endpoints";
export const SOLANA_MAINNET = "mainnet-beta" as const;
export function solanaConfig(env: NodeJS.ProcessEnv = process.env) {
  const cluster = solanaClusterDefinition(env.POWERCHAIN_SOLANA_NETWORK);
  const rpc = solanaRpcPool(env);
  const websocket = solanaWsPool(env);
  return { chain: "SOLANA" as const, cluster, network: cluster.network, rpc, websocket, commitment: "confirmed" as const, finality: "finalized" as const, publicRpcAllowedInProduction: false as const };
}
