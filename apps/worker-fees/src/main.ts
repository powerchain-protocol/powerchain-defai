import { createWorkerHeartbeat, workerRuntimeConfig } from "@powerchain/backend/workers";
import { closeDatabase } from "@powerchain/database";
import { claimServiceFeeVerificationBatch, recordServiceFeeVerificationError, releaseServiceFeeVerificationLease, verifyServiceFeeForTransfer } from "@powerchain/backend";
import { runSupervisedWorker, throwIfAborted, type SupervisedWorkerContext } from "@powerchain/runtime";

const { workerId, idleMs: intervalMs, leaseMs, batchSize } = workerRuntimeConfig("fees");
const heartbeat = createWorkerHeartbeat({ workerId, kind: "fees" });

async function tick({ signal }: SupervisedWorkerContext) {
  throwIfAborted(signal);
  await heartbeat.beat();
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
  cleanup: async () => { await heartbeat.stop(); await closeDatabase(); },
});
