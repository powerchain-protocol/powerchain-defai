import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const proxy = read("apps/bridge/proxy.ts");
const policy = read("apps/bridge/server/routing/core-policy.ts");
const apiRouter = read("apps/bridge/server/routing/api-router.ts");
const limiter = read("apps/backend/src/utils/rate-limiter.ts");
const productionEnv = read(".env.production.example");
const routes = read("apps/backend/src/routing/routes.ts");
assert(routes.includes('id: "version"') && routes.includes('/api/v1/version'), "version endpoint must be included in canonical route policy");

assert(proxy.includes("evaluateCoreRoutePolicy"), "proxy must enforce policy for registered critical routes");
assert(proxy.includes("CORE_ROUTE_GUARDED_HEADER"), "proxy must mark guarded requests");
assert(proxy.includes('status: 405') && proxy.includes('allow: allowedMethods'), "proxy must return 405 + Allow for registered path method mismatch");
assert(proxy.includes("Unknown routes remain compatible"), "non-critical generated routes must remain compatible");
assert(proxy.includes('requestId: input.traceId') && proxy.includes('traceId,'), "proxy errors must retain request correlation IDs");
for (const header of ["x-powerchain-rate-limit", "x-powerchain-rate-remaining", "x-powerchain-rate-reset"]) {
  assert(proxy.includes(header), `proxy missing ${header}`);
}
assert(policy.includes("FEATURE_SWAP_DISABLED"), "swap feature gate missing from centralized route policy");
assert(policy.includes("FEATURE_BRIDGE_DISABLED") && policy.includes("WORMHOLE_DISABLED"), "bridge feature gates missing from centralized route policy");
assert(policy.includes("consumeRateLimit"), "centralized route policy must enforce bounded process-local throttling");
assert(apiRouter.includes('request.headers.get(CORE_ROUTE_GUARDED_HEADER) !== "1"'), "route-handler guard must avoid proxy double counting");
assert(apiRouter.includes("evaluateCoreRoutePolicy"), "direct handler invocation must preserve fail-closed policy");
assert(limiter.includes("DEFAULT_MAX_BUCKETS = 10_000"), "rate limiter must have a bounded default capacity");
assert(limiter.includes("POWERCHAIN_RATE_LIMIT_MAX_BUCKETS"), "rate limiter capacity must be operator-configurable within bounds");
assert(limiter.includes("buckets.delete") && limiter.includes("least-recently-touched"), "rate limiter must prune expired/overflow buckets");
assert(limiter.includes("rateLimiterDiagnostics"), "bounded limiter must expose process-local diagnostics");
assert(productionEnv.includes("POWERCHAIN_RATE_LIMIT_MAX_BUCKETS=10000"), "production env template missing bounded rate limiter capacity");

console.log("[route-policy] centralized critical-route policy, 405 handling, request IDs, and bounded limiter passed");
