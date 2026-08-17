import { createWorkerHeartbeat, createWorkerMaintenanceGuard, workerRuntimeConfig } from "@powerchain/backend/workers";
import { closeDatabase } from "@powerchain/database";
import { claimServiceFeeVerificationBatch, recordServiceFeeVerificationError, releaseServiceFeeVerificationLease, renewServiceFeeVerificationLease, verifyServiceFeeForTransfer } from "@powerchain/backend/fees";
import { drainClaimBudget, runSupervisedWorker, runWithLeaseRenewal, throwIfAborted, type SupervisedWorkerContext } from "@powerchain/runtime";

const { workerId, idleMs: intervalMs, leaseMs, batchSize, heartbeatMs } = workerRuntimeConfig("fees");
const heartbeat = createWorkerHeartbeat({ workerId, kind: "fees" });
const maintenanceState = createWorkerMaintenanceGuard();
await heartbeat.start(heartbeatMs);

async function tick({ signal }: SupervisedWorkerContext) {
  throwIfAborted(signal);
  await heartbeat.beat();
  if ((await maintenanceState()).draining) return;
  await drainClaimBudget({
    budget: batchSize,
    signal,
    claimOne: async () => (await claimServiceFeeVerificationBatch({ workerId, limit: 1, leaseMs }))[0],
    process: async (claim) => {
      try {
        await runWithLeaseRenewal({
          name: `fees:${claim.transferId}`,
          leaseMs,
          signal,
          renew: () => renewServiceFeeVerificationLease({ transferId: claim.transferId, workerId, leaseMs }),
          run: () => verifyServiceFeeForTransfer(claim.transferId),
        });
        await releaseServiceFeeVerificationLease({ transferId: claim.transferId, workerId });
      } catch (error) {
        const message = error instanceof Error ? error.message : "SERVICE_FEE_WORKER_ERROR";
        try { await recordServiceFeeVerificationError(claim.transferId, message.slice(0, 160)); }
        finally { await releaseServiceFeeVerificationLease({ transferId: claim.transferId, workerId }); }
        console.error("POWERCHAIN_FEE_VERIFY_RETRY", { transferId: claim.transferId, error: message });
      }
    },
  });
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
