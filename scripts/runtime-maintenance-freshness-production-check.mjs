import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");
const failures = [];
const need = (file, markers) => {
  const source = read(file);
  for (const marker of markers) if (!source.includes(marker)) failures.push(`${file}: missing ${marker}`);
};

need("apps/backend/src/workers/maintenance.ts", [
  "POWERCHAIN_WORKER_MAINTENANCE_TIMEOUT_MS",
  "MAINTENANCE_STATE_TIMEOUT",
  "readHealthy",
  'source: "database-unavailable"',
  "readWorkerMaintenanceState",
]);
need("apps/backend/src/services/operations.ts", ["readWorkerMaintenanceState", "maintenance.readHealthy", "maintenance.source", "maintenance.revision"]);
need("apps/bridge/server/services/system-readiness.ts", ['source: "database-unavailable" as const', "maintenance: { ...maintenance"]);
need("apps/bridge/lib/data/system-readiness-validation.ts", ["maintenance.readHealthy", "maintenance.lastSuccessfulReadAt", "maintenance.cacheAgeMs"]);
need("apps/bridge/app/api/v1/system/readiness/route.ts", ['source: "database-unavailable"', "readHealthy: false", "draining: true"]);
need("apps/bridge/app/api/v1/operations/status/route.ts", ['source: "database-unavailable"', "readHealthy: false", "draining: true"]);
need("packages/database/src/index.ts", ["current.draining === input.draining", "current.reason === reason"]);
need("apps/bridge/server/services/runtime-maintenance.ts", ["changed: persisted.revision !== input.expectedRevision"]);
for (const file of [".env.example", ".env.local.example", ".env.production.example", "apps/bridge/.env.example"]) {
  need(file, ["POWERCHAIN_WORKER_MAINTENANCE_TIMEOUT_MS=1500"]);
}
const pkg = JSON.parse(read("package.json"));
if (pkg.scripts?.["runtime-maintenance-freshness:production:check"] !== "node scripts/runtime-maintenance-freshness-production-check.mjs") failures.push("package.json: freshness gate script missing");
if (!pkg.scripts?.["verify:production"]?.includes("runtime-maintenance-freshness:production:check")) failures.push("package.json: freshness gate not wired into verify:production");

if (failures.length) {
  console.error(`[runtime-maintenance-freshness] ${failures.length} failure(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("[runtime-maintenance-freshness] bounded reads, fail-closed source metadata, strict fallbacks, and idempotent mutations passed");
