import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const required = [
  "apps/bridge/server/services/system-readiness.ts",
  "apps/bridge/app/api/v1/system/readiness/route.ts",
  "apps/bridge/types/system-readiness.ts",
  "apps/bridge/lib/data/system-readiness-validation.ts",
  "apps/bridge/backend/system-readiness-client.ts",
  "apps/bridge/hooks/use-system-readiness.ts",
];
for (const file of required) if (!fs.existsSync(path.join(root, file))) throw new Error(`SYSTEM_READINESS_FILE_MISSING:${file}`);

const service = read(required[0]);
for (const marker of ["getOperationsStatus", "checkProviderReadiness", "routePolicyDiagnostics", "asyncSettlement", "newOperations", "authoritativeForSettlement: false"]) {
  if (!service.includes(marker)) throw new Error(`SYSTEM_READINESS_SERVICE_MARKER_MISSING:${marker}`);
}
if (!service.includes('state = "blocked"') || !service.includes('state = "degraded"')) throw new Error("SYSTEM_READINESS_FAIL_CLOSED_STATE_REQUIRED");
for (const marker of ["operations?.workers.observed", "operations?.workers.readyCount", "operations?.workers.missing", "operations?.workers.stale"]) if (!service.includes(marker)) throw new Error(`SYSTEM_READINESS_WORKER_EVIDENCE_MISSING:${marker}`);

const route = read(required[1]);
for (const marker of ["checkSystemReadiness", 'readiness.state === "blocked" ? 503 : 200', '"Retry-After": "5"', '"Cache-Control": "no-store, max-age=0"']) {
  if (!route.includes(marker)) throw new Error(`SYSTEM_READINESS_ROUTE_MARKER_MISSING:${marker}`);
}
const endpoints = read("apps/bridge/backend/endpoints.ts");
if (!endpoints.includes('readiness: "/api/v1/system/readiness"')) throw new Error("SYSTEM_READINESS_ENDPOINT_REGISTRY_MISSING");
const routes = read("apps/backend/src/routing/routes.ts");
if (!routes.includes('id: "system-readiness"') || !routes.includes('path: "/api/v1/system/readiness"')) throw new Error("SYSTEM_READINESS_CORE_ROUTE_MISSING");
const dashboard = read("apps/bridge/components/status/operational-status-dashboard.tsx");
for (const marker of ["useSystemReadiness", "System execution envelope", "Async settlement", "Queue attention"]) {
  if (!dashboard.includes(marker)) throw new Error(`SYSTEM_READINESS_UI_MARKER_MISSING:${marker}`);
}
const validator = read(required[3]);
if (!validator.includes("authoritativeForBalances !== false") || !validator.includes("authoritativeForSettlement !== false")) throw new Error("SYSTEM_READINESS_AUTHORITY_BOUNDARY_MISSING");
console.log("system-readiness-production-check: PASS");
