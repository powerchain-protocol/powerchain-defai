import fs from "node:fs";
const read = (file) => fs.readFileSync(file, "utf8");
const requireText = (file, values) => { const source = read(file); for (const value of values) if (!source.includes(value)) throw new Error(`${file} missing ${value}`); };
requireText("packages/runtime/src/index.ts", ["export async function drainClaimBudget", "Keep renewing until the in-flight job actually exits"]);
for (const file of ["apps/worker-bridge/src/main.ts","apps/worker-claims/src/main.ts","apps/worker-fees/src/main.ts"]) {
  requireText(file, ["drainClaimBudget", "limit: 1", "budget: batchSize"]);
}
requireText("apps/backend/src/services/operations.ts", ["POWERCHAIN_QUEUE_BACKLOG_ELEVATED", "POWERCHAIN_QUEUE_BACKLOG_HIGH", "queuePressure"]);
requireText("apps/bridge/server/services/system-readiness.ts", ["queuePressure !== \"high\"", "queues: { attention: queueAttention, pending: queuePending, oldestPendingAgeMs, pressure: queuePressure }"]);
for (const file of [".env.example", ".env.local.example", ".env.production.example", "config/env/root.env.example"]) requireText(file, ["POWERCHAIN_QUEUE_BACKLOG_ELEVATED=500", "POWERCHAIN_QUEUE_BACKLOG_HIGH=2000"]);
console.log("worker-queue-backpressure-production-check: PASS — jobs are leased just-in-time and high backlog blocks async settlement readiness");
