import { closeDatabase, heartbeatWorker, removeWorkerHeartbeat } from "@powerchain/database";
import { claimServiceFeeVerificationBatch, recordServiceFeeVerificationError, releaseServiceFeeVerificationLease, verifyServiceFeeForTransfer } from "@powerchain/backend";
import { parseBoundedInteger, runSupervisedWorker, throwIfAborted, type SupervisedWorkerContext } from "@powerchain/runtime";

const workerId = process.env.POWERCHAIN_FEE_WORKER_ID?.trim() || `fee-${process.pid}`;
const intervalMs = parseBoundedInteger(process.env.POWERCHAIN_FEE_WORKER_INTERVAL_MS, 5_000, { min: 1_000, max: 300_000 });
const batchSize = parseBoundedInteger(process.env.POWERCHAIN_FEE_WORKER_BATCH_SIZE, 100, { min: 1, max: 250 });
const leaseMs = parseBoundedInteger(process.env.POWERCHAIN_FEE_WORKER_LEASE_MS, 60_000, { min: 10_000, max: 300_000 });
const startedAt = new Date();

async function tick({ signal }: SupervisedWorkerContext) {
  throwIfAborted(signal);
  await heartbeatWorker({ workerId, workerType: "fees", version: "1.0.0", startedAt });
  const claims = await claimServiceFeeVerificationBatch({ workerId, limit: batchSize, leaseMs });
  for (const claim of claims) {
    throwIfAborted(signal);
    try {
      await verifyServiceFeeForTransfer(claim.transferId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "SERVICE_FEE_WORKER_ERROR";
      try { await recordServiceFeeVerificationError(claim.transferId, message.slice(0, 160)); }
      finally { await releaseServiceFeeVerificationLease({ transferId: claim.transferId, workerId }); }
      console.error("POWERCHAIN_FEE_VERIFY_RETRY", { transferId: claim.transferId, error: message });
    }
  }
}

await runSupervisedWorker({
  name: "service-fee-worker",
  idleMs: intervalMs,
  maxBackoffMs: 60_000,
  tickTimeoutMs: 120_000,
  shutdownTimeoutMs: 15_000,
  run: tick,
  cleanup: async () => { await removeWorkerHeartbeat(workerId); await closeDatabase(); },
});
