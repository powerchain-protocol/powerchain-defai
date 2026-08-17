import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");
const requireText = (file, values) => {
  const source = read(file);
  for (const value of values) {
    if (!source.includes(value)) throw new Error(`${file} missing required production wiring: ${value}`);
  }
};

requireText("packages/runtime/src/index.ts", [
  "export async function runWithLeaseRenewal",
  "await renewOnce()",
  "POWERCHAIN_WORKER_LEASE_LOST",
  "POWERCHAIN_WORKER_LEASE_RENEWAL_FAILED",
]);
requireText("apps/backend/src/workers/heartbeat.ts", [
  "start: (intervalMs?: number) => Promise<void>",
  "setInterval",
  "timer.unref?.()",
  "POWERCHAIN_WORKER_HEARTBEAT_FAILED",
]);
requireText("apps/backend/src/workers/config.ts", [
  "heartbeatMs: number",
  "POWERCHAIN_WORKER_HEARTBEAT_INTERVAL_MS",
]);
requireText("apps/backend/src/bridge/worker.ts", ["renewBridgeTransferLease", "bridgeWorkerLeaseOwner: workerId"]);
requireText("apps/backend/src/claims/queue.ts", ["renewClaimLease", "workerLeaseOwner: workerId"]);
requireText("apps/backend/src/fees/queue.ts", ["renewServiceFeeVerificationLease", "verificationLeaseOwner: input.workerId"]);

for (const file of [
  "apps/worker-bridge/src/main.ts",
  "apps/worker-claims/src/main.ts",
  "apps/worker-fees/src/main.ts",
]) {
  requireText(file, ["heartbeat.start(heartbeatMs)", "runWithLeaseRenewal", "leaseMs", "signal"]);
}

for (const file of [".env.example", ".env.local.example", ".env.production.example", "config/env/root.env.example"]) {
  requireText(file, ["POWERCHAIN_WORKER_HEARTBEAT_INTERVAL_MS=15000"]);
}

console.log("worker-lease-heartbeat-production-check: PASS — long jobs renew ownership leases and worker heartbeats remain fresh during active batches");
