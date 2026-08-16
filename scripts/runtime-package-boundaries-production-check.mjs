import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const must = (condition, message) => { if (!condition) throw new Error(message); };

const nextConfig = read("apps/bridge/next.config.ts");
for (const packageName of [
  "@powerchain/backend",
  "@powerchain/database",
  "@powerchain/runtime",
  "@powerchain/protocol",
  "@powerchain/blockchain",
  "@powerchain/clusters",
  "@powerchain/chat",
  "@powerchain/staking", "@powerchain/bridge-core",
]) {
  must(nextConfig.includes(`"${packageName}"`), `NEXT_TRANSPILE_PACKAGE_MISSING:${packageName}`);
}

const endpoints = read("apps/backend/src/config/endpoints.ts");
for (const token of [
  'network === "mainnet-beta"',
  'network === "devnet"',
  'return null;',
  "solanaRpcPool",
  "solanaWsPool",
  "POWERCHAIN_SOLANA_WS_FALLBACK_URLS",
]) {
  must(endpoints.includes(token), `CANONICAL_SOLANA_ENDPOINT_POLICY_MISSING:${token}`);
}
must(!/testnet\.helius-rpc\.com/.test(endpoints), "UNVERIFIED_HELIUS_TESTNET_ENDPOINT_FORBIDDEN");

const rpc = read("apps/backend/src/services/rpc.ts");
for (const token of ["solanaRpcUrls", "solanaWebSocketUrls", "solanaWsPool"]) {
  must(rpc.includes(token), `CANONICAL_RPC_EXPORT_MISSING:${token}`);
}

must(!fs.existsSync(path.join(root, "apps/bridge/server/rpc/solana-endpoints.ts")), "BRIDGE_LOCAL_SOLANA_ENDPOINT_POLICY_FORBIDDEN");
for (const file of [
  "apps/bridge/server/rpc/providers.ts",
  "apps/bridge/server/services/bridge-config.ts",
  "apps/bridge/app/api/v1/fees/token-2022/route.ts",
]) {
  const source = read(file);
  must(source.includes("@powerchain/backend/services/rpc"), `CANONICAL_RPC_IMPORT_REQUIRED:${file}`);
}

const bridgeConfig = read("apps/backend/src/bridge/config.ts");
must(bridgeConfig.includes("@powerchain/blockchain"), "BRIDGE_SHARED_BLOCKCHAIN_IMPORT_REQUIRED");
must(bridgeConfig.includes("crossChainPair(direction)"), "BRIDGE_SHARED_DIRECTION_PAIR_REQUIRED");
must(!bridgeConfig.includes("@mysten/sui/utils"), "BRIDGE_DIRECT_SUI_NORMALIZER_DUPLICATION_FORBIDDEN");

console.log("Runtime/package boundaries production check: PASS");
