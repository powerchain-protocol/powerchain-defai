import "server-only";

import { checkDatabaseReady, getWorkerReadiness } from "@powerchain/database";
import { prisma } from "@powerchain/database/prisma";

export type OperationalState = "healthy" | "degraded" | "blocked";
export type QueueSnapshot = { name: "bridge" | "claims" | "fees"; pending: number; attention: number };
export type OperationsStatus = {
  state: OperationalState;
  database: { ready: boolean };
  workers: Awaited<ReturnType<typeof getWorkerReadiness>>;
  queues: QueueSnapshot[];
  checkedAt: string;
  authoritativeForBridgeAccounting: false;
};

async function databaseReady(): Promise<boolean> {
  try {
    return await checkDatabaseReady();
  } catch {
    return false;
  }
}

async function queueSnapshot(): Promise<QueueSnapshot[]> {
  const [bridgePending, bridgeAttention, claimPending, claimAttention, feePending, feeAttention] = await Promise.all([
    prisma.bridgeTransfer.count({ where: { status: { in: ["CREATED", "SOURCE_SUBMITTING", "SOURCE_SUBMITTED", "SOURCE_FINALIZED", "MESSAGE_OBSERVED", "DESTINATION_SUBMITTED", "DESTINATION_FINALIZED"] } } }),
    prisma.bridgeTransfer.count({ where: { status: { in: ["RECONCILIATION_REQUIRED", "FAILED"] } } }),
    prisma.claim.count({ where: { status: { in: ["RESERVED", "SUBMITTING", "SUBMITTED"] } } }),
    prisma.claim.count({ where: { status: { in: ["FAILED", "UNKNOWN"] } } }),
    prisma.bridgeServiceFeeSettlement.count({ where: { status: { in: ["ASSESSED", "SUBMITTED", "RETRY_WAIT"] } } }),
    prisma.bridgeServiceFeeSettlement.count({ where: { status: { in: ["FAILED", "MANUAL_REVIEW"] } } }),
  ]);
  return [
    { name: "bridge", pending: bridgePending, attention: bridgeAttention },
    { name: "claims", pending: claimPending, attention: claimAttention },
    { name: "fees", pending: feePending, attention: feeAttention },
  ];
}

export async function getOperationsStatus(input: { maxWorkerAgeMs?: number } = {}): Promise<OperationsStatus> {
  const maxWorkerAgeMs = Math.max(5_000, Math.min(300_000, input.maxWorkerAgeMs ?? 60_000));
  const [database, workers] = await Promise.all([
    databaseReady(),
    getWorkerReadiness({ maxAgeMs: maxWorkerAgeMs }).catch(() => ({ ready: false, maxAgeMs: maxWorkerAgeMs, workers: [] })),
  ]);
  let queues: QueueSnapshot[] = [];
  if (database) queues = await queueSnapshot();
  const attention = queues.reduce((sum, queue) => sum + queue.attention, 0);
  const state: OperationalState = !database ? "blocked" : !workers.ready || attention > 0 ? "degraded" : "healthy";
  return {
    state,
    database: { ready: database },
    workers,
    queues,
    checkedAt: new Date().toISOString(),
    authoritativeForBridgeAccounting: false,
  };
}
