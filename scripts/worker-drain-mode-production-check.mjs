import fs from "node:fs";

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const failures = [];
const maintenance = read("apps/backend/src/workers/maintenance.ts");
const readiness = read("apps/bridge/server/services/system-readiness.ts");
const validator = read("apps/bridge/lib/data/system-readiness-validation.ts");
for (const file of ["apps/worker-bridge/src/main.ts", "apps/worker-claims/src/main.ts", "apps/worker-fees/src/main.ts"]) {
  const source = read(file);
  if (!source.includes("createWorkerMaintenanceGuard") || !source.includes("if ((await maintenanceState()).draining) return")) failures.push(`${file}: dynamic drain guard missing`);
}
if (!maintenance.includes("POWERCHAIN_WORKER_DRAIN_MODE") || !maintenance.includes("environment-override") || !maintenance.includes("database-unavailable")) failures.push("dynamic maintenance guard / fail-safe override missing");
if (!readiness.includes("maintenance: { ...maintenance, draining, activeLeases, quiescent }") || !readiness.includes("&& !draining")) failures.push("system readiness drain gating missing");
if (!validator.includes('typeof maintenance.draining !== "boolean"')) failures.push("system readiness drain validation missing");
for (const file of [".env.example", ".env.local.example", ".env.production.example"]) { if (!read(file).includes("POWERCHAIN_WORKER_DRAIN_MODE=false")) failures.push(`${file}: drain env missing`); }
if (failures.length) { console.error(failures.join("\n")); process.exit(1); }
console.log("[worker-drain-mode] dynamic worker claim guards, fail-safe override, readiness gating, validation, and env templates passed");
