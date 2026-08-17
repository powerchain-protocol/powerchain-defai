import {
  claimBridgeTransferBatch,
  processBridgeTransfer,
  recordBridgeTransferRetry,
  releaseBridgeTransferLease,
  renewBridgeTransferLease,
} from "@powerchain/backend/bridge";
import { createWorkerHeartbeat, createWorkerMaintenanceGuard, workerRuntimeConfig } from "@powerchain/backend/workers";
import { closeDatabase } from "@powerchain/database";
import { drainClaimBudget, runSupervisedWorker, runWithLeaseRenewal, throwIfAborted } from "@powerchain/runtime";

const { workerId, idleMs, leaseMs, batchSize, heartbeatMs } = workerRuntimeConfig("bridge");
const heartbeat = createWorkerHeartbeat({ workerId, kind: "bridge" });
const maintenanceState = createWorkerMaintenanceGuard();

await heartbeat.start(heartbeatMs);
await runSupervisedWorker({
  name: "bridge-worker",
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
      claimOne: async () => (await claimBridgeTransferBatch({ workerId, limit: 1, leaseMs }))[0],
      process: async (job) => {
        try {
          await runWithLeaseRenewal({
            name: `bridge:${job.id}`,
            leaseMs,
            signal,
            renew: () => renewBridgeTransferLease(job.id, workerId, leaseMs),
            run: () => processBridgeTransfer(job.id),
          });
          await releaseBridgeTransferLease(job.id, workerId);
        } catch (error) {
          await recordBridgeTransferRetry(job.id, workerId, error instanceof Error ? error.message : "BRIDGE_WORKER_ERROR");
        }
      },
    });
  },
  cleanup: async () => {
    await heartbeat.stop();
    await closeDatabase();
  },
});
