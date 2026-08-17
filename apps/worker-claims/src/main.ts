import { createWorkerHeartbeat, createWorkerMaintenanceGuard, workerRuntimeConfig } from "@powerchain/backend/workers";
import { closeDatabase } from "@powerchain/database";
import { claimClaimPayoutBatch, finalizeClaimPayout, recordClaimRetry, releaseClaimLease, renewClaimLease, submitClaimPayout } from "@powerchain/backend/claims";
import { drainClaimBudget, runSupervisedWorker, runWithLeaseRenewal, throwIfAborted } from "@powerchain/runtime";

const { workerId, idleMs, leaseMs, batchSize, heartbeatMs } = workerRuntimeConfig("claims");
const heartbeat = createWorkerHeartbeat({ workerId, kind: "claims" });
const maintenanceState = createWorkerMaintenanceGuard();
await heartbeat.start(heartbeatMs);

await runSupervisedWorker({
  name: "claim-worker",
  idleMs,
  maxBackoffMs: 60_000,
  tickTimeoutMs: 120_000,
  shutdownTimeoutMs: 15_000,
  run: async ({ signal }) => {
    throwIfAborted(signal);
    await heartbeat.beat();
    if ((await maintenanceState()).draining) return;
    await drainClaimBudget({
      budget: batchSize,
      signal,
      claimOne: async () => (await claimClaimPayoutBatch({ workerId, limit: 1, leaseMs }))[0],
      process: async (job) => {
        try {
          await runWithLeaseRenewal({
            name: `claims:${job.id}`,
            leaseMs,
            signal,
            renew: () => renewClaimLease(job.id, workerId, leaseMs),
            run: async () => {
              if (job.status === "SUBMITTING") await submitClaimPayout(job.id);
              else await finalizeClaimPayout(job.id);
            },
          });
          await releaseClaimLease(job.id, workerId);
        } catch (error) {
          await recordClaimRetry(job.id, workerId, error instanceof Error ? error.message : "CLAIM_WORKER_ERROR");
        }
      },
    });
  },
  cleanup: async () => { await heartbeat.stop(); await closeDatabase(); },
});
