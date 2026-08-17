import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const schema = read("prisma/schema.prisma");
const migration = read("prisma/migrations/20260817000100_runtime_maintenance_state/migration.sql");
const supabaseMigration = read("supabase/migrations/20260817000100_runtime_maintenance_state.sql");
const db = read("packages/database/src/index.ts");
const guard = read("apps/backend/src/workers/maintenance.ts");
const operations = read("apps/backend/src/services/operations.ts");
const route = read("apps/bridge/app/api/v1/operator/maintenance/route.ts");
const service = read("apps/bridge/server/services/runtime-maintenance.ts");
const routes = read("apps/backend/src/routing/routes.ts");
const cli = read("scripts/operator-maintenance-state.mjs");
for (const worker of ["apps/worker-bridge/src/main.ts","apps/worker-claims/src/main.ts","apps/worker-fees/src/main.ts"]) {
  const source = read(worker);
  if (!source.includes("createWorkerMaintenanceGuard") || !source.includes("await maintenanceState()")) throw new Error(`dynamic maintenance guard missing: ${worker}`);
}
if (!schema.includes("model RuntimeMaintenanceState") || !migration.includes("runtime_maintenance_state") || !supabaseMigration.includes("runtime_maintenance_state") || !supabaseMigration.includes("REVOKE ALL")) throw new Error("runtime maintenance persistence / Supabase lock-down missing");
if (!db.includes("MAINTENANCE_REVISION_CONFLICT") || !db.includes("runtime.maintenance.drain-enabled") || !db.includes("runtime.maintenance.drain-disabled")) throw new Error("maintenance compare-and-swap/audit missing");
if (!guard.includes('source: "environment-override"') || !guard.includes('source: "database-unavailable"') || !guard.includes('draining: true')) throw new Error("maintenance guard must fail closed and preserve env override");
if (!operations.includes("readWorkerMaintenanceState") || !operations.includes("const draining = maintenance.draining") || !operations.includes("readHealthy: maintenance.readHealthy")) throw new Error("operations readiness must consume bounded persisted maintenance state fail closed");
if (!route.includes("export async function GET") || !route.includes("export async function PUT") || !route.includes("expectedRevision")) throw new Error("operator maintenance route incomplete");
if (!service.includes("MAINTENANCE_ENV_OVERRIDE_ACTIVE")) throw new Error("environment override must not be remotely disabled");
if (!routes.includes("operator-maintenance-read") || !routes.includes("operator-maintenance-update")) throw new Error("critical route registration missing");
if (!cli.includes('"drain"') || !cli.includes('"resume"') || !cli.includes("expectedRevision")) throw new Error("operator maintenance CLI incomplete");
console.log("[runtime-maintenance] persisted drain/resume CAS, audit, dynamic worker guard, fail-safe override, route and CLI passed");
