import { heartbeatWorker, removeWorkerHeartbeat } from "@powerchain/database";
import type { WorkerKind } from "./config";

export type WorkerHeartbeatController = {
  beat: () => Promise<void>;
  start: (intervalMs?: number) => Promise<void>;
  stop: () => Promise<void>;
};

export function createWorkerHeartbeat(input: { workerId: string; kind: WorkerKind; startedAt?: Date }): WorkerHeartbeatController {
  const startedAt = input.startedAt ?? new Date();
  let timer: NodeJS.Timeout | undefined;
  let inFlight: Promise<void> | undefined;
  const beat = async () => {
    if (inFlight) return inFlight;
    inFlight = heartbeatWorker({ workerId: input.workerId, workerType: input.kind, version: "1.0.0", startedAt })
      .then(() => undefined)
      .finally(() => { inFlight = undefined; });
    return inFlight;
  };
  return {
    beat,
    start: async (intervalMs = 15_000) => {
      await beat();
      if (timer) return;
      const boundedInterval = Math.max(5_000, Math.min(60_000, Math.trunc(intervalMs)));
      timer = setInterval(() => {
        void beat().catch((error) => console.error("POWERCHAIN_WORKER_HEARTBEAT_FAILED", { workerId: input.workerId, kind: input.kind, error: error instanceof Error ? error.message : String(error) }));
      }, boundedInterval);
      timer.unref?.();
    },
    stop: async () => {
      if (timer) clearInterval(timer);
      timer = undefined;
      if (inFlight) await inFlight.catch(() => undefined);
      await removeWorkerHeartbeat(input.workerId);
    },
  };
}
