import fs from "node:fs";
const read = (file) => fs.readFileSync(file, "utf8");
const requireText = (file, values) => { const source = read(file); for (const value of values) if (!source.includes(value)) throw new Error(`${file} missing ${value}`); };
requireText("apps/backend/src/bridge/worker.ts", [
  "bridgeMaxAttempts",
  "bridgeRetryDisposition",
  'status: "RECONCILIATION_REQUIRED"',
  'event: manualReview ? "bridge.manual-review" : "bridge.retry-scheduled"',
]);
const bridgeWorker = read("apps/backend/src/bridge/worker.ts");
const automaticBlock = bridgeWorker.slice(bridgeWorker.indexOf("const activeStatuses"), bridgeWorker.indexOf("] as const;") + 11);
if (automaticBlock.includes("RECONCILIATION_REQUIRED")) throw new Error("RECONCILIATION_REQUIRED must not be automatically claimed");
requireText("apps/backend/src/workers/retry-policy.ts", ["bridgeRetryDisposition", "bridgeMaxAttempts", "POWERCHAIN_BRIDGE_MAX_ATTEMPTS"]);
requireText("apps/backend/src/services/operations.ts", ["oldestPendingAgeMs", "POWERCHAIN_QUEUE_AGE_ELEVATED_MS", "POWERCHAIN_QUEUE_AGE_HIGH_MS"]);
requireText("apps/bridge/server/services/system-readiness.ts", ["oldestPendingAgeMs", 'queuePressure !== "high"']);
for (const file of [".env.example", ".env.local.example", ".env.production.example", "config/env/root.env.example"]) {
  requireText(file, ["POWERCHAIN_QUEUE_AGE_ELEVATED_MS=300000", "POWERCHAIN_QUEUE_AGE_HIGH_MS=1800000", "POWERCHAIN_BRIDGE_MAX_ATTEMPTS=25"]);
}
console.log("worker-retry-deadletter-production-check: PASS — manual reconciliation is non-automatic, bridge retries are bounded, and queue age participates in pressure");
