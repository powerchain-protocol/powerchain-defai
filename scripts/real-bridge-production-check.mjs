import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const must = [
  "apps/backend/src/bridge/rpc.ts",
  "apps/backend/src/services/rpc.ts",
  "apps/backend/src/bridge/wormholescan.ts",
  "apps/backend/src/bridge/worker.ts",
  "apps/backend/src/bridge/contracts.ts",
  "apps/backend/src/sui/client.ts",
  "apps/worker-bridge/src/main.ts",
  "apps/bridge/server/services/bridge-config.ts",
  "apps/bridge/server/services/bridge-events.ts",
  "apps/bridge/app/api/v1/bridge/config/route.ts",
  "apps/bridge/app/api/v1/bridge/routes/route.ts",
  "apps/bridge/app/api/v1/bridge/transfers/[id]/source/route.ts",
  "apps/bridge/app/api/v1/bridge/transfers/[id]/events/route.ts",
  "apps/bridge/app/api/v1/bridge/transfers/[id]/events/stream/route.ts",
  "prisma/migrations/20260815000300_real_ntt_bridge/migration.sql",
  "supabase/migrations/20260815000300_real_ntt_bridge.sql",
];
for (const file of must) if (!fs.existsSync(path.join(root, file))) throw new Error(`missing ${file}`);

const schema = fs.readFileSync(path.join(root, "prisma/schema.prisma"), "utf8");
for (const token of ["wormholeOperationId", "sourceVerifiedAt", "destinationVerifiedAt", "reconciliationEvidence", "bridgeWorkerLeaseOwner"]) {
  if (!schema.includes(token)) throw new Error(`schema missing ${token}`);
}

const worker = fs.readFileSync(path.join(root, "apps/backend/src/bridge/worker.ts"), "utf8");
for (const token of [
  "verifyBridgeChainTransaction",
  "findNttOperationForTransfer",
  "assertServiceFeeVerified",
  "writeBridgeAuditEvent",
  "bridge.retry-scheduled",
  "RECONCILIATION_REQUIRED",
  "COMPLETED",
]) if (!worker.includes(token)) throw new Error(`worker missing ${token}`);

const rpc = fs.readFileSync(path.join(root, "apps/backend/src/bridge/rpc.ts"), "utf8");
for (const token of [
  'commitment:"finalized"',
  "SOLANA_NTT_MANAGER_NOT_INVOKED",
  "SUI_NTT_MANAGER_NOT_INVOKED",
  "PRINCIPAL_DEBIT_MISMATCH",
  "PRINCIPAL_CREDIT_MISMATCH",
  "solanaRpcRequest",
  "withPowerChainSuiClient",
]) if (!rpc.includes(token)) throw new Error(`rpc verification missing ${token}`);

const sharedRpc = fs.readFileSync(path.join(root, "apps/backend/src/services/rpc.ts"), "utf8");
for (const token of ["solanaRpcPool", "POWERCHAIN_SOLANA_RPC_URL_REQUIRED", "solanaRpcRequest", "rpcRuntimeStatus"]) if (!sharedRpc.includes(token)) throw new Error(`shared rpc service missing ${token}`);

const sui = fs.readFileSync(path.join(root, "apps/backend/src/sui/client.ts"), "utf8");
for (const token of [
  "SuiGrpcClient",
  "POWERCHAIN_SUI_GRPC_FALLBACK_URLS",
  "withPowerChainSuiClient",
  "probePowerChainSuiGrpc",
  "client.core.getBalance",
]) if (!sui.includes(token)) throw new Error(`Sui gRPC fallback missing ${token}`);

const bridgeConfig = fs.readFileSync(path.join(root, "apps/bridge/server/services/bridge-config.ts"), "utf8");
for (const token of [
  'sourceAsset: "wPWRC"',
  'destinationAsset: "PWRC"',
  "POWERCHAIN_SOLANA_WS_FALLBACK_URLS",
  "POWERCHAIN_SUI_GRPC_FALLBACK_URLS",
  "NEXT_PUBLIC_POWERCHAIN_REALTIME_WS_FALLBACK_URLS",
  'sseFallback: "/api/v1/bridge/transfers/:id/events/stream"',
]) if (!bridgeConfig.includes(token)) throw new Error(`bridge config missing ${token}`);

const stream = fs.readFileSync(path.join(root, "apps/bridge/app/api/v1/bridge/transfers/[id]/events/stream/route.ts"), "utf8");
for (const token of ["text/event-stream", "loadBridgeEventSnapshot", "event: snapshot"]) {
  if (!stream.includes(token)) throw new Error(`SSE fallback missing ${token}`);
}

const realtime = fs.readFileSync(path.join(root, "apps/bridge/lib/realtime/reconnecting-websocket.ts"), "utf8");
for (const token of ["endpointIndex", "endpointCount", "currentUrl"]) {
  if (!realtime.includes(token)) throw new Error(`WebSocket failover missing ${token}`);
}

console.log("real bridge production check: PASS");
