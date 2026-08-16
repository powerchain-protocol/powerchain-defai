import "server-only";

import { heartbeatWorker, removeWorkerHeartbeat } from "@powerchain/database";
import type { WorkerKind } from "./config";

export type WorkerHeartbeatController = {
  beat: () => Promise<void>;
  stop: () => Promise<void>;
};

export function createWorkerHeartbeat(input: { workerId: string; kind: WorkerKind; startedAt?: Date }): WorkerHeartbeatController {
  const startedAt = input.startedAt ?? new Date();
  return {
    beat: () => heartbeatWorker({ workerId: input.workerId, workerType: input.kind, version: "1.0.0", startedAt }).then(() => undefined),
    stop: () => removeWorkerHeartbeat(input.workerId),
  };
}
