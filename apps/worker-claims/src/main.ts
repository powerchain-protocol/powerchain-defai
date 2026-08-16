import { createWorkerHeartbeat, workerRuntimeConfig } from "@powerchain/backend/workers";
import { closeDatabase } from "@powerchain/database";
import { claimClaimPayoutBatch, finalizeClaimPayout, recordClaimRetry, releaseClaimLease, submitClaimPayout } from "@powerchain/backend";
import { runSupervisedWorker, throwIfAborted } from "@powerchain/runtime";

const { workerId, idleMs, leaseMs, batchSize } = workerRuntimeConfig("claims");
const heartbeat = createWorkerHeartbeat({ workerId, kind: "claims" });

await runSupervisedWorker({
  name: "claim-worker",
  idleMs,
  maxBackoffMs: 60_000,
  tickTimeoutMs: 120_000,
  shutdownTimeoutMs: 15_000,
  run: async ({ signal }) => {
    throwIfAborted(signal);
    await heartbeat.beat();
    const jobs = await claimClaimPayoutBatch({ workerId, limit: batchSize, leaseMs });
    for (const job of jobs) {
      throwIfAborted(signal);
      try {
        if (job.status === "SUBMITTING") await submitClaimPayout(job.id);
        else await finalizeClaimPayout(job.id);
        await releaseClaimLease(job.id, workerId);
      } catch (error) {
        await recordClaimRetry(job.id, workerId, error instanceof Error ? error.message : "CLAIM_WORKER_ERROR");
      }
    }
  },
  cleanup: async () => { await heartbeat.stop(); await closeDatabase(); },
});
