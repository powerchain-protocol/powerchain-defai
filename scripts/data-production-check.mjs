#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "apps/bridge/lib/data/errors.ts",
  "apps/bridge/lib/data/http-client.ts",
  "apps/bridge/server/rpc/endpoint-pool.ts",
  "apps/bridge/server/rpc/json-rpc-client.ts",
  "apps/bridge/server/rpc/rpc-method-policy.ts",
  "apps/bridge/server/rpc/providers.ts",
  "apps/bridge/server/services/provider-health.ts",
  "apps/bridge/app/api/v1/providers/health/route.ts",
  "apps/bridge/app/api/v1/providers/readiness/route.ts",
  "apps/bridge/app/api/v1/providers/diagnostics/route.ts",
  "apps/bridge/lib/realtime/reconnecting-websocket.ts",
  "apps/bridge/lib/realtime/transport-policy.ts",
  "apps/bridge/hooks/use-provider-health.ts",
  "apps/bridge/hooks/use-provider-readiness.ts",
  "apps/bridge/lib/data/runtime-validation.ts",
  "apps/bridge/lib/data/data.ts",
  "apps/bridge/server/services/metrics.ts",
  "apps/bridge/app/api/v1/metrics/bridge/route.ts",
  "apps/bridge/components/bridge/bridge-metrics-card.tsx",
  "apps/bridge/components/bridge/provider-status-strip.tsx",
  "apps/bridge/hooks/use-transfer-status.ts",
  "apps/bridge/lib/data/decimal.ts",
  "apps/bridge/server/services/chain-data.ts",
  "apps/bridge/server/services/sui-metadata.ts",
  "apps/bridge/server/services/market-prices.ts",
  "apps/backend/src/services/prices.ts",
  "apps/backend/src/services/rates.ts",
  "apps/bridge/app/api/v1/data/solana/route.ts",
  "apps/bridge/app/api/v1/data/sui/route.ts",
  "apps/bridge/app/api/v1/data/pwrc/route.ts",
  "apps/bridge/app/api/v1/market/prices/route.ts",
  "apps/bridge/hooks/use-pwrc-live-data.ts",
  "apps/bridge/components/bridge/live-chain-data-card.tsx",
  "apps/bridge/server/services/asset-integrity.ts",
  "apps/bridge/app/api/v1/data/pwrc/integrity/route.ts",
  "apps/bridge/hooks/use-pwrc-integrity.ts",
  "apps/bridge/components/bridge/asset-integrity-card.tsx",
  "apps/bridge/app/api/v1/data/pwrc/snapshot/route.ts",
];
const fail = (message) => { console.error(`POWERCHAIN_DATA_PRODUCTION_CHECK_FAILED: ${message}`); process.exit(1); };
for (const rel of required) if (!fs.existsSync(path.join(root, rel))) fail(`missing ${rel}`);
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const rpc = read("apps/bridge/server/rpc/json-rpc-client.ts");
const policy = read("apps/bridge/server/rpc/rpc-method-policy.ts");
const pool = read("apps/bridge/server/rpc/endpoint-pool.ts");
const providers = read("apps/bridge/server/rpc/providers.ts");
const healthRoute = read("apps/bridge/app/api/v1/providers/health/route.ts");
const readinessRoute = read("apps/bridge/app/api/v1/providers/readiness/route.ts");
const diagnosticsRoute = read("apps/bridge/app/api/v1/providers/diagnostics/route.ts");
const healthService = read("apps/bridge/server/services/provider-health.ts");
const ws = read("apps/bridge/lib/realtime/reconnecting-websocket.ts");
const http = read("apps/bridge/lib/data/http-client.ts");
const transferStatus = read("apps/bridge/hooks/use-transfer-status.ts");
const errors = read("apps/bridge/lib/data/errors.ts");
if (!rpc.includes('import "server-only"')) fail("RPC client must remain server-only");
if (!policy.includes('"sendTransaction"') || !policy.includes('"sui_executeTransactionBlock"')) fail("side-effecting RPC method policy missing");
if (!policy.includes("cannot be marked idempotent") || !policy.includes("cannot use stale cache")) fail("write/idempotency/cache contradiction guards missing");
if (!rpc.includes("rpcMethodAllowsFailover") || !rpc.includes("canFailover ? candidates : candidates.slice(0, 1)")) fail("method-policy failover boundary missing");
if (!rpc.includes("this.inflight") || !rpc.includes("dedupeHits")) fail("single-flight RPC read deduplication missing");
if (!rpc.includes("MAX_READ_CACHE_TTL_MS = 5_000") || !rpc.includes("MAX_STALE_IF_ERROR_MS = 30_000")) fail("bounded fresh/stale RPC cache policy missing");
if (!rpc.includes('source: "stale-cache"') || !rpc.includes("staleIfErrorMs")) fail("stale-if-error metadata missing");
if (!rpc.includes("POWERCHAIN_RPC_MAX_CONCURRENCY") || !rpc.includes("rejectedByConcurrency")) fail("RPC concurrency guard/metrics missing");
if (!rpc.includes("requestQuorum") || !policy.includes("QUORUM_SAFE_METHODS")) fail("approved read quorum helper missing");
if (!rpc.includes("hedgeAfterMs") || !policy.includes("rpcMethodAllowsHedging")) fail("safe-read hedging boundary missing");
if (!rpc.includes('attempts.includes("RATE_LIMITED")')) fail("429 must stop provider fan-out");
if (!pool.includes('RpcCircuitState = "closed" | "open" | "half-open"')) fail("RPC circuit state missing");
if (!pool.includes("globalCooldownUntil") || !pool.includes("RATE_LIMIT_COOLDOWN_MS = 10_000")) fail("pool-wide 429 cooldown missing");
if (!providers.includes("PUBLIC_RPC_HOSTS") || !providers.includes("distinct provider host") || !providers.includes("values.length < 2")) fail("production RPC topology validation missing");
if (!providers.includes("let solanaRuntime") || !providers.includes("client: new JsonRpcClient(pool)")) fail("per-chain RPC client singleton missing");
if (!healthRoute.includes('"cache-control": "no-store')) fail("provider health must be no-store");
if (healthRoute.includes("RPC_URL") || healthRoute.includes("process.env")) fail("health endpoint must not expose RPC configuration");
if (!healthService.includes('"healthy" | "degraded" | "unavailable"') || !healthService.includes("staleIfErrorMs: 10_000")) fail("degraded stale-health semantics missing");
if (!healthService.includes("checkProviderReadiness") || !readinessRoute.includes("result.ready ? 200 : 503")) fail("strict provider readiness endpoint missing");
if (readinessRoute.includes("RPC_URL") || readinessRoute.includes("process.env")) fail("readiness endpoint must not expose RPC configuration");
if (!ws.includes("heartbeatTimeoutMs") || !ws.includes("heartbeatTimeouts") || !ws.includes("acknowledgePong")) fail("websocket pong deadline/metrics missing");
if (!transferStatus.includes("startWebSocket") || !transferStatus.includes("startStream") || !transferStatus.includes("startPolling")) fail("WebSocket -> SSE -> polling integration missing");
if (!rpc.includes("MAX_CACHE_ENTRIES = 512") || !rpc.includes("cacheEvictions")) fail("bounded RPC cache/eviction metrics missing");
if (!rpc.includes("requestBudgetMs") || !rpc.includes("MAX_REQUEST_BUDGET_MS = 30_000") || !rpc.includes("budgetTimeouts")) fail("bounded total RPC request budget missing");
if (!rpc.includes("!options.signal && options.requestBudgetMs === undefined")) fail("caller cancellation must be isolated from shared single-flight work");
if (!pool.includes("activeRequests") || !pool.includes("ewmaLatencyMs") || !pool.includes("EWMA_ALPHA")) fail("endpoint load/EWMA selection missing");
if (!rpc.includes("this.pool.begin(endpoint.id)") || !rpc.includes("this.pool.end(endpoint.id)")) fail("endpoint active request accounting missing");
if (!diagnosticsRoute.includes("processLocal: true") || !diagnosticsRoute.includes("authoritativeForAccounting: false")) fail("sanitized process-local diagnostics semantics missing");
if (diagnosticsRoute.includes("RPC_URL") || diagnosticsRoute.includes("process.env") || diagnosticsRoute.includes("endpoint.url")) fail("diagnostics endpoint must not expose RPC configuration");
if (!ws.includes("maxMessageBytes") || !ws.includes("oversizedMessages") || !ws.includes('close(1009, "message too large")')) fail("websocket message-size backpressure guard missing");
if (!ws.includes("maxMessagesPerSecond") || !ws.includes("rateLimitedMessages") || !ws.includes('close(1013, "message rate exceeded")')) fail("websocket message-rate backpressure guard missing");
if (!rpc.includes("clearReadCache") || !rpc.includes("invalidateRead") || !rpc.includes("cacheInvalidations")) fail("explicit RPC cache invalidation controls missing");
if (!rpc.includes('if (safety === "write") this.clearReadCache()')) fail("successful RPC writes must invalidate process-local read cache");
if (!rpc.includes("quorumDisagreements") || !rpc.includes("hedgedRequests") || !rpc.includes("hedgeFallbackWins")) fail("quorum/hedging observability metrics missing");
if (!pool.includes("successes") || !pool.includes("failures")) fail("per-endpoint success/failure counters missing");
if (!healthService.includes("requestBudgetMs: 5_000") || !healthService.includes("redundancy") || !healthService.includes("degraded")) fail("readiness request budget/redundancy semantics missing");
if (!readinessRoute.includes("ready-degraded")) fail("readiness degraded redundancy header missing");
if (!rpc.includes("POWERCHAIN_RPC_MAX_CACHE_ENTRIES") || !rpc.includes("MAX_CACHE_ENTRY_LIMIT = 2_048")) fail("bounded configurable RPC cache cap missing");


const providerHealthHook = read("apps/bridge/hooks/use-provider-health.ts");
const providerClient = read("apps/bridge/backend/provider-client.ts");
const runtimeValidation = read("apps/bridge/lib/data/runtime-validation.ts");
const transportPolicy = read("apps/bridge/lib/realtime/transport-policy.ts");
if (!providerHealthHook.includes("requestGeneration") || !providerHealthHook.includes("activeController") || !providerHealthHook.includes("providerClient.health")) fail("provider health stale-request/runtime validation hardening missing");
if (!providerClient.includes("isProviderHealthPayload") || !providerClient.includes("isProviderReadinessPayload") || !providerClient.includes("timeoutMs: PROVIDER_RUNTIME_CONFIG.timeoutMs")) fail("central provider client runtime validation/timeout hardening missing");
if (!runtimeValidation.includes("isProviderReadinessPayload") || !runtimeValidation.includes("ageMs")) fail("provider payload validation/freshness helpers missing");
if (!transportPolicy.includes("RealtimeFallbackReason") || !transportPolicy.includes("websocket-exhausted")) fail("realtime fallback reason semantics missing");
if (!transportPolicy.includes("url.username || url.password")) fail("realtime URL credential rejection missing");


const chainData = read("apps/bridge/server/services/chain-data.ts");
const suiMetadata = read("apps/bridge/server/services/sui-metadata.ts");
const marketPrices = read("apps/backend/src/services/prices.ts");
const marketPriceCompat = read("apps/bridge/server/services/market-prices.ts");
const pwrcDataRoute = read("apps/bridge/app/api/v1/data/pwrc/route.ts");
const pricesRoute = read("apps/bridge/app/api/v1/market/prices/route.ts");
const liveDataHook = read("apps/bridge/hooks/use-pwrc-live-data.ts");
const liveDataCard = read("apps/bridge/components/bridge/live-chain-data-card.tsx");
if (!chainData.includes('getTokenSupply') || !chainData.includes('getTokenAccountsByOwner') || !chainData.includes('commitment: "finalized"')) fail("finalized Solana PWRC reads missing");
if (!chainData.includes('getPowerChainSuiBalance') || !chainData.includes('probePowerChainSuiGrpc')) fail("Sui gRPC wPWRC balance/readiness reads missing");
if (!chainData.includes('BigInt(tokenAmount.amount)') || !chainData.includes('authoritativeForBridgeAccounting: false')) fail("exact chain amount/accounting-boundary semantics missing");
if (!suiMetadata.includes('coinMetadata(coinType: $coinType)') || !suiMetadata.includes('POWERCHAIN_SUI_GRAPHQL_URL')) fail("Sui GraphQL metadata path missing");
if (!marketPrices.includes('/v2/updates/price/latest') || !marketPrices.includes('PYTH_API_KEY') || !marketPrices.includes('publish_time')) fail("Pyth Hermes real price integration missing");
if (!marketPrices.includes('/defi/price') || !marketPrices.includes('BIRDEYE_API_KEY') || !marketPrices.includes('asset !== "PWRC"')) fail("Birdeye PWRC fallback boundary missing");
if (!marketPriceCompat.includes('@powerchain/backend/services/prices') || marketPriceCompat.includes('pyth.dourolabs.app')) fail("bridge-local market price provider duplication forbidden");
if (!marketPrices.includes('POWERCHAIN_PRICE_MAX_AGE_MS') || !marketPrices.includes('authoritativeForBridgeAccounting: false')) fail("market freshness/non-authoritative semantics missing");
if (!pwrcDataRoute.includes('Promise.allSettled') || !pwrcDataRoute.includes('cache-control')) fail("partial-failure PWRC aggregate endpoint missing");
if (!pricesRoute.includes('s-maxage=5') || !pricesRoute.includes('slice(0, 5)')) fail("bounded market-price endpoint caching/input missing");
if (!liveDataHook.includes('generation') || !liveDataHook.includes('AbortController')) fail("live chain-data stale-request isolation missing");
if (!liveDataCard.includes('Market price is informational only') || !liveDataCard.includes('independently verified evidence')) fail("UI chain/market authority disclosure missing");

const integrityService = read("apps/bridge/server/services/asset-integrity.ts");
const integrityRoute = read("apps/bridge/app/api/v1/data/pwrc/integrity/route.ts");
const integrityHook = read("apps/bridge/hooks/use-pwrc-integrity.ts");
const integrityCard = read("apps/bridge/components/bridge/asset-integrity-card.tsx");
if (!integrityService.includes('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb')) fail("Token-2022 mint ownership integrity check missing");
if (!integrityService.includes('mint-authority-revoked') || !integrityService.includes('freeze-authority-revoked')) fail("PWRC authority revocation integrity checks missing");
if (!integrityService.includes('POWERCHAIN_PWRC_EXPECTED_SUPPLY_BASE_UNITS') || !integrityService.includes('fixed-supply')) fail("canonical PWRC fixed-supply integrity check missing");
if (!integrityService.includes('requestQuorum<string>("getGenesisHash"') || !integrityService.includes('rpc-genesis-quorum')) fail("Solana network identity quorum check missing");
if (!integrityService.includes('POWERCHAIN_SOLANA_EXPECTED_GENESIS_HASH') || !integrityService.includes('POWERCHAIN_SUI_EXPECTED_CHAIN_IDENTIFIER')) fail("optional production network identity pinning missing");
if (!integrityService.includes('metadata-available') || !integrityService.includes('POWERCHAIN_WPWRC_EXPECTED_SYMBOL')) fail("Sui wPWRC metadata/symbol integrity check missing");
if (!integrityRoute.includes('result.healthy ? 200 : 503') || !integrityRoute.includes('x-powerchain-asset-integrity')) fail("asset-integrity endpoint health semantics missing");
if (integrityRoute.includes('process.env') || integrityRoute.includes('RPC_URL')) fail("asset-integrity endpoint must not expose configuration");
if (!integrityHook.includes('AbortController') || !integrityHook.includes('generation')) fail("asset-integrity UI stale-request isolation missing");
if (!integrityCard.includes('operational validation, not bridge accounting evidence')) fail("asset-integrity accounting-boundary disclosure missing");
if (!integrityService.includes('REQUIRED_MINT_EXTENSIONS = new Set(["metadatapointer", "tokenmetadata"])')) fail("required Token-2022 metadata extension policy missing");
if (!integrityService.includes("transferfeeconfig") || !integrityService.includes("permanentdelegate") || !integrityService.includes("scaleduiamountconfig") || !integrityService.includes("pausable")) fail("forbidden Token-2022 extension policy missing");
if (!integrityService.includes("metadata-pointer-self")) fail("metadata pointer self-reference integrity check missing");
if (!integrityService.includes("POWERCHAIN_CHAIN_HEAD_MAX_AGE_MS") || !integrityService.includes("finalized-head-fresh") || !integrityService.includes("grpc-responsive")) fail("chain liveness/freshness integrity checks missing");
if (!integrityService.includes("POWERCHAIN_PWRC_EXPECTED_ASSET_FINGERPRINT") || !integrityService.includes("assetFingerprint")) fail("stable asset fingerprint/pinning missing");
const snapshotRoute = read("apps/bridge/app/api/v1/data/pwrc/snapshot/route.ts");
if (!snapshotRoute.includes("snapshotId") || !snapshotRoute.includes("authoritativeForBridgeAccounting: false") || !snapshotRoute.includes('"cache-control": "no-store')) fail("non-authoritative no-store PWRC snapshot endpoint missing");

if (!http.includes("AbortController") || !errors.includes("retry-after")) fail("HTTP timeout/retry handling missing");
if (read("apps/bridge/lib/realtime/transport-policy.ts").includes("OPERATOR_API_TOKEN")) fail("operator secret leaked to realtime client");

const canonicalData = read("apps/bridge/lib/data/data.ts");
const bridgeMetrics = read("apps/bridge/server/services/metrics.ts");
const bridgeMetricsRoute = read("apps/bridge/app/api/v1/metrics/bridge/route.ts");
const bridgeMetricsCard = read("apps/bridge/components/bridge/bridge-metrics-card.tsx");
if (!canonicalData.includes("BRIDGE_DIRECTIONS") || !canonicalData.includes("BRIDGE_TRANSFER_STATUSES") || !canonicalData.includes("isBridgeMetricsPayload")) fail("canonical bridge data/status/metrics validation missing");
if (!bridgeMetrics.includes('import "server-only"') || !bridgeMetrics.includes("persisted-bridge-database") || !bridgeMetrics.includes("terminalCompletionRateBps")) fail("persisted server-only bridge metrics service missing");
if (!bridgeMetrics.includes("prisma.bridgeTransfer.count") || !bridgeMetrics.includes("prisma.bridgeTransfer.aggregate")) fail("bridge metrics must derive from persisted transfer data");
if (!bridgeMetricsRoute.includes('cache-control": "no-store') || !bridgeMetricsRoute.includes("BRIDGE_METRICS_UNAVAILABLE")) fail("bridge metrics endpoint no-store/fail-closed semantics missing");
if (!bridgeMetricsCard.includes("No synthetic TVL, TPS, or volume estimates") || !bridgeMetricsCard.includes("isBridgeMetricsPayload")) fail("bridge metrics UI evidence/validation boundary missing");
if (!bridgeMetrics.includes("sourceFinality") || !bridgeMetrics.includes("messageObservation") || !bridgeMetrics.includes("destinationFinality") || !bridgeMetrics.includes("completedInWindowBaseUnits")) fail("persisted bridge lifecycle/direction metrics missing");
if (!bridgeMetricsCard.includes('label: "24h"') || !bridgeMetricsCard.includes('label: "7d"') || !bridgeMetricsCard.includes('label: "30d"') || !bridgeMetricsCard.includes("Lifecycle timing · selected window")) fail("bridge metrics window/lifecycle UX missing");
if (!bridgeMetricsCard.includes("navigator.onLine") || !bridgeMetricsCard.includes("AbortController") || !bridgeMetricsCard.includes("8_000")) fail("bridge metrics offline/timeout/cancellation hardening missing");
if (!bridgeMetricsRoute.includes("BRIDGE_METRICS_WINDOW_INVALID") || !bridgeMetricsRoute.includes('export const runtime = "nodejs"')) fail("bridge metrics strict query/runtime boundary missing");
const metricsMigration = read("prisma/migrations/20260816000100_bridge_metrics_indexes/migration.sql");
const metricsSupabaseMigration = read("supabase/migrations/20260816000100_bridge_metrics_indexes.sql");
if (!metricsMigration.includes('bridge_transfers_created_at_idx') || !metricsMigration.includes('bridge_transfers_direction_created_at_idx')) fail("bridge metrics database indexes missing");
if (metricsMigration !== metricsSupabaseMigration) fail("bridge metrics Prisma/Supabase migration mirror drift");

console.log("POWERCHAIN_DATA_BASE_CHECK_PASS version=1.0.0");

// Fully-wired runtime gate: fresh provider readiness + asset identity are composed server-side.
{
  const runtimeService = read("apps/bridge/server/services/bridge-runtime.ts");
  const runtimeRoute = read("apps/bridge/app/api/v1/bridge/runtime/route.ts");
  const runtimeHook = read("apps/bridge/hooks/use-bridge-runtime.ts");
  if (!runtimeService.includes("checkProviderReadiness")) fail("bridge runtime must use strict provider readiness");
  if (!runtimeService.includes("checkPwrcAssetIntegrity")) fail("bridge runtime must use PWRC asset integrity");
  if (!runtimeService.includes("canRequestQuote")) fail("bridge runtime must expose quote gate");
  if (!runtimeService.includes("canOpenWalletSignature")) fail("bridge runtime must expose signing gate");
  if (!runtimeService.includes("authoritativeForBridgeAccounting: false")) fail("runtime gate must not claim accounting authority");
  if (!runtimeRoute.includes('"cache-control": "no-store, max-age=0"')) fail("bridge runtime endpoint must be no-store");
  if (!runtimeRoute.includes('status: runtime.status === "blocked" ? 503 : 200')) fail("blocked runtime must return 503");
  if (!runtimeHook.includes("generation")) fail("runtime hook must isolate stale request generations");
  if (!runtimeHook.includes("AbortController")) fail("runtime hook must cancel obsolete requests");
  if (!runtimeHook.includes("useNetworkOnline")) fail("runtime hook must be offline-aware");
}


// Runtime execution integration: fresh server checks must protect quote/submit paths.
{
  const runtimeService = read("apps/bridge/server/services/bridge-runtime.ts");
  const runtimeGuard = read("apps/bridge/server/http/bridge-runtime-guard.ts");
  const runtimeHook = read("apps/bridge/hooks/use-bridge-runtime.ts");
  if (!runtimeService.includes("canSubmitTransfer") || !runtimeService.includes("capabilities")) fail("runtime capability matrix missing");
  if (!runtimeService.includes("snapshotId") || !runtimeService.includes("validUntil")) fail("runtime snapshot freshness contract missing");
  if (!runtimeGuard.includes("BRIDGE_RUNTIME_BLOCKED") || !runtimeGuard.includes("retry-after")) fail("fail-closed bridge mutation guard missing");
  if (!runtimeHook.includes("Date.parse(data.validUntil)") || !runtimeHook.includes("canSubmitTransfer")) fail("client runtime freshness/capability enforcement missing");
}

console.log("POWERCHAIN_DATA_PRODUCTION_CHECK_OK version=1.0.0");
