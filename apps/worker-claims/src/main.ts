import { closeDatabase, heartbeatWorker, removeWorkerHeartbeat } from "@powerchain/database";
import { claimClaimPayoutBatch, finalizeClaimPayout, recordClaimRetry, releaseClaimLease, submitClaimPayout } from "@powerchain/backend";
import { parseBoundedInteger, runSupervisedWorker, throwIfAborted } from "@powerchain/runtime";

const workerId = process.env.POWERCHAIN_CLAIM_WORKER_ID?.trim() || `claim-${process.pid}`;
const startedAt = new Date();
const idleMs = parseBoundedInteger(process.env.POWERCHAIN_CLAIM_WORKER_INTERVAL_MS, 5_000, { min: 1_000, max: 300_000 });
const leaseMs = parseBoundedInteger(process.env.POWERCHAIN_CLAIM_WORKER_LEASE_MS, 60_000, { min: 10_000, max: 300_000 });

await runSupervisedWorker({
  name: "claim-worker",
  idleMs,
  maxBackoffMs: 60_000,
  tickTimeoutMs: 120_000,
  shutdownTimeoutMs: 15_000,
  run: async ({ signal }) => {
    throwIfAborted(signal);
    await heartbeatWorker({ workerId, workerType: "claims", version: "1.0.0", startedAt });
    const jobs = await claimClaimPayoutBatch({ workerId, limit: 50, leaseMs });
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
  cleanup: async () => { await removeWorkerHeartbeat(workerId); await closeDatabase(); },
});
