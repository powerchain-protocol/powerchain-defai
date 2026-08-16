import { createWorkerHeartbeat, workerRuntimeConfig } from "@powerchain/backend/workers";
import { closeDatabase } from "@powerchain/database";
import { claimBridgeTransferBatch, processBridgeTransfer, recordBridgeTransferRetry, releaseBridgeTransferLease } from "@powerchain/backend";
import { runSupervisedWorker, throwIfAborted } from "@powerchain/runtime";
const { workerId, idleMs, leaseMs, batchSize } = workerRuntimeConfig("bridge");
const heartbeat = createWorkerHeartbeat({ workerId, kind: "bridge" });
await runSupervisedWorker({name:"bridge-worker",idleMs,maxBackoffMs:60_000,tickTimeoutMs:120_000,shutdownTimeoutMs:15_000,run:async({signal})=>{throwIfAborted(signal);await heartbeat.beat();const jobs=await claimBridgeTransferBatch({workerId,limit:batchSize,leaseMs});for(const job of jobs){throwIfAborted(signal);try{await processBridgeTransfer(job.id);await releaseBridgeTransferLease(job.id,workerId);}catch(error){await recordBridgeTransferRetry(job.id,workerId,error instanceof Error?error.message:"BRIDGE_WORKER_ERROR");}}},cleanup:async()=>{await heartbeat.stop();await closeDatabase();}});
