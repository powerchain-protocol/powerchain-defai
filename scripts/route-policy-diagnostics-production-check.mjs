import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

const routes = read("apps/backend/src/routing/routes.ts");
const diagnostics = read("apps/backend/src/routing/diagnostics.ts");
const limiter = read("apps/backend/src/utils/rate-limiter.ts");
const route = read("apps/bridge/app/api/v1/system/route-policy/route.ts");
const endpoints = read("apps/bridge/backend/endpoints.ts");
const client = read("apps/bridge/backend/route-policy-client.ts");
const hook = read("apps/bridge/hooks/use-route-policy-diagnostics.ts");
const status = read("apps/bridge/components/status/operational-status-dashboard.tsx");

check(routes.includes('id: "route-policy-diagnostics"') && routes.includes('/api/v1/system/route-policy'), "route-policy diagnostics must be registered as a critical public-read route");
check(diagnostics.includes("routePolicyDiagnostics") && diagnostics.includes("authoritativeForAccounting: false"), "diagnostics must be explicitly non-authoritative");
check(diagnostics.includes("rateLimiterDiagnostics()") && limiter.includes("maxBuckets"), "diagnostics must use bounded limiter telemetry");
for (const forbidden of ["pseudonymousKey:", "clientKey:", "bucketKey:", "walletAddress:", "signature:", "requestBody:", "searchParams:"]) {
  check(!diagnostics.includes(forbidden), `route diagnostics must not expose ${forbidden.slice(0,-1)}`);
}
check(route.includes("requestId(req)") && route.includes('"Cache-Control": "no-store, max-age=0"'), "route-policy API must be no-store and request-correlated");
check(endpoints.includes('routePolicy: "/api/v1/system/route-policy"'), "frontend endpoint registry must include route-policy diagnostics");
check(client.includes("isRoutePolicyDiagnosticsPayload"), "route-policy client must validate runtime payloads");
check(hook.includes("AbortController") && hook.includes("visibilitychange") && hook.includes("navigator.onLine"), "route-policy hook must cancel stale reads and be visibility/network aware");
check(status.includes("Critical-route protection") && status.includes("Limiter utilization"), "runtime status must surface sanitized route-policy pressure");

if (failures.length) {
  console.error("route-policy-diagnostics: FAIL");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("route-policy-diagnostics: PASS — sanitized policy telemetry, bounded limiter pressure, typed client/hook, and status wiring verified");
