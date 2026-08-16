import { suiClusterDefinition } from "@powerchain/clusters";
import { suiGrpcPool } from "./endpoints";
export function suiConfig(env: NodeJS.ProcessEnv = process.env) {
  const cluster = suiClusterDefinition(env.POWERCHAIN_SUI_NETWORK ?? env.SUI_NETWORK);
  return { chain: "SUI" as const, cluster, network: cluster.network, grpc: suiGrpcPool(), blockingReads: "grpc-core" as const, legacyJsonRpcCriticalPath: false as const };
}
