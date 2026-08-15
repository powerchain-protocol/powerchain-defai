export type RpcMethodSafety = "read" | "write" | "unknown";

const READ_METHODS = new Set([
  "getAccountInfo", "getBalance", "getBlock", "getBlockHeight", "getBlockTime", "getEpochInfo", "getGenesisHash",
  "getLatestBlockhash", "getMultipleAccounts", "getProgramAccounts", "getSignatureStatuses", "getSlot", "getSupply",
  "getTokenAccountBalance", "getTokenAccountsByOwner", "getTokenSupply", "getTransaction", "getVersion",
  "sui_getLatestCheckpointSequenceNumber", "sui_getCheckpoint", "sui_getObject", "sui_multiGetObjects", "sui_getTransactionBlock",
  "suix_getBalance", "suix_getAllBalances", "suix_getCoins", "suix_getCoinMetadata", "suix_getTotalSupply", "suix_queryTransactionBlocks",
]);

const WRITE_METHODS = new Set([
  "sendTransaction", "requestAirdrop", "simulateBundle", "sendBundle",
  "sui_executeTransactionBlock", "sui_dryRunTransactionBlock", "sui_devInspectTransactionBlock",
]);

const QUORUM_SAFE_METHODS = new Set([
  "getGenesisHash", "getVersion", "getSupply", "getTokenSupply", "suix_getCoinMetadata", "suix_getTotalSupply",
]);

export function classifyRpcMethod(method: string): RpcMethodSafety {
  if (WRITE_METHODS.has(method)) return "write";
  if (READ_METHODS.has(method)) return "read";
  return "unknown";
}

export function rpcMethodAllowsFailover(method: string, explicitIdempotent?: boolean) {
  const safety = classifyRpcMethod(method);
  if (safety === "write") return false;
  if (safety === "read") return true;
  return explicitIdempotent === true;
}

export function rpcMethodAllowsHedging(method: string, explicitIdempotent?: boolean) {
  return classifyRpcMethod(method) === "read" && rpcMethodAllowsFailover(method, explicitIdempotent);
}

export function rpcMethodAllowsQuorum(method: string) {
  return QUORUM_SAFE_METHODS.has(method);
}

export function assertRpcMethodOptions(method: string, explicitIdempotent?: boolean, cacheTtlMs?: number, staleIfErrorMs?: number) {
  const safety = classifyRpcMethod(method);
  if (safety === "write" && explicitIdempotent === true) throw new Error(`RPC method ${method} is side-effecting and cannot be marked idempotent`);
  if (safety === "write" && (cacheTtlMs ?? 0) > 0) throw new Error(`RPC method ${method} is side-effecting and cannot be cached`);
  if (safety === "write" && (staleIfErrorMs ?? 0) > 0) throw new Error(`RPC method ${method} is side-effecting and cannot use stale cache`);
}
