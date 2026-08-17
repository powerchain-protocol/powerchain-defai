import { checkDatabaseReady, getWorkerReadiness } from "@powerchain/database";
import { prisma } from "@powerchain/database/prisma";
import { REQUIRED_WORKER_KINDS } from "../workers/config";
import { readWorkerMaintenanceState, type WorkerMaintenanceSource } from "../workers/maintenance";

export type OperationalState = "healthy" | "degraded" | "blocked";
export type QueuePressure = "normal" | "elevated" | "high";
export type QueueSnapshot = { name: "bridge" | "claims" | "fees"; pending: number; attention: number; activeLeases: number; oldestPendingAgeMs: number | null; pressure: QueuePressure };
export type OperatorAttentionQueue = "bridge" | "claims" | "fees";
export type OperatorAttentionItem = Readonly<{ queue: OperatorAttentionQueue; id: string; status: string; failureCode: string | null; attemptCount: number; updatedAt: string }>;
export type OperatorAttentionSummary = Readonly<Record<OperatorAttentionQueue, number>>;
type BridgeAttentionRow = { id: string; status: string; failureCode: string | null; bridgeAttemptCount: number; updatedAt: Date };
type ClaimAttentionRow = { id: string; status: string; failureCode: string | null; attemptCount: number; updatedAt: Date };
type FeeAttentionRow = { id: string; status: string; failureCode: string | null; attemptCount: number; updatedAt: Date };
export type OperatorAttentionPage = Readonly<{
  items: readonly OperatorAttentionItem[];
  summary: OperatorAttentionSummary;
  nextBefore: string | null;
  checkedAt: string;
  authoritativeForSettlement: false;
}>;
export type OperationsStatus = {
  state: OperationalState;
  database: { ready: boolean };
  workers: Awaited<ReturnType<typeof getWorkerReadiness>> & {
    expected: number;
    observed: number;
    readyCount: number;
    missing: string[];
    stale: string[];
  };
  queues: QueueSnapshot[];
  queuePressure: QueuePressure;
  maintenance: { draining: boolean; activeLeases: number; quiescent: boolean; source: WorkerMaintenanceSource; revision: number; readHealthy: boolean; checkedAt: string; lastSuccessfulReadAt: string | null; cacheAgeMs: number };
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

function queuePressure(pending: number, oldestPendingAgeMs: number | null, countElevatedAt: number, countHighAt: number, ageElevatedAtMs: number, ageHighAtMs: number): QueuePressure {
  if (pending >= countHighAt || (oldestPendingAgeMs !== null && oldestPendingAgeMs >= ageHighAtMs)) return "high";
  if (pending >= countElevatedAt || (oldestPendingAgeMs !== null && oldestPendingAgeMs >= ageElevatedAtMs)) return "elevated";
  return "normal";
}

function pressureRank(value: QueuePressure): number { return value === "high" ? 2 : value === "elevated" ? 1 : 0; }

async function queueSnapshot(): Promise<QueueSnapshot[]> {
  const bridgePendingWhere = { status: { in: ["CREATED", "SOURCE_SUBMITTING", "SOURCE_SUBMITTED", "SOURCE_FINALIZED", "MESSAGE_OBSERVED", "DESTINATION_SUBMITTED", "DESTINATION_FINALIZED"] as const } };
  const claimPendingWhere = { status: { in: ["RESERVED", "SUBMITTING", "SUBMITTED"] as const } };
  const feePendingWhere = { status: { in: ["ASSESSED", "SUBMITTED", "RETRY_WAIT"] as const } };
  const nowDate = new Date();
  const [bridgePending, bridgeAttention, claimPending, claimAttention, feePending, feeAttention, bridgeOldest, claimOldest, feeOldest, bridgeActiveLeases, claimActiveLeases, feeActiveLeases] = await Promise.all([
    prisma.bridgeTransfer.count({ where: bridgePendingWhere }),
    prisma.bridgeTransfer.count({ where: { status: { in: ["RECONCILIATION_REQUIRED", "FAILED"] } } }),
    prisma.claim.count({ where: claimPendingWhere }),
    prisma.claim.count({ where: { status: { in: ["FAILED", "UNKNOWN"] } } }),
    prisma.bridgeServiceFeeSettlement.count({ where: feePendingWhere }),
    prisma.bridgeServiceFeeSettlement.count({ where: { status: { in: ["FAILED", "MANUAL_REVIEW"] } } }),
    prisma.bridgeTransfer.findFirst({ where: bridgePendingWhere, orderBy: { updatedAt: "asc" }, select: { updatedAt: true } }),
    prisma.claim.findFirst({ where: claimPendingWhere, orderBy: { updatedAt: "asc" }, select: { updatedAt: true } }),
    prisma.bridgeServiceFeeSettlement.findFirst({ where: feePendingWhere, orderBy: { updatedAt: "asc" }, select: { updatedAt: true } }),
    prisma.bridgeTransfer.count({ where: { ...bridgePendingWhere, bridgeWorkerLeaseUntil: { gt: nowDate }, bridgeWorkerLeaseOwner: { not: null } } }),
    prisma.claim.count({ where: { ...claimPendingWhere, workerLeaseUntil: { gt: nowDate }, workerLeaseOwner: { not: null } } }),
    prisma.bridgeServiceFeeSettlement.count({ where: { ...feePendingWhere, verificationLeaseUntil: { gt: nowDate }, verificationLeaseOwner: { not: null } } }),
  ]);
  const countElevatedAt = Math.max(10, Math.min(100_000, Number(process.env.POWERCHAIN_QUEUE_BACKLOG_ELEVATED ?? 500) || 500));
  const countHighAt = Math.max(countElevatedAt + 1, Math.min(250_000, Number(process.env.POWERCHAIN_QUEUE_BACKLOG_HIGH ?? 2_000) || 2_000));
  const ageElevatedAtMs = Math.max(60_000, Math.min(86_400_000, Number(process.env.POWERCHAIN_QUEUE_AGE_ELEVATED_MS ?? 300_000) || 300_000));
  const ageHighAtMs = Math.max(ageElevatedAtMs + 1_000, Math.min(604_800_000, Number(process.env.POWERCHAIN_QUEUE_AGE_HIGH_MS ?? 1_800_000) || 1_800_000));
  const now = Date.now();
  const age = (row: { updatedAt: Date } | null): number | null => row ? Math.max(0, now - row.updatedAt.getTime()) : null;
  const bridgeAge = age(bridgeOldest);
  const claimAge = age(claimOldest);
  const feeAge = age(feeOldest);
  return [
    { name: "bridge", pending: bridgePending, attention: bridgeAttention, activeLeases: bridgeActiveLeases, oldestPendingAgeMs: bridgeAge, pressure: queuePressure(bridgePending, bridgeAge, countElevatedAt, countHighAt, ageElevatedAtMs, ageHighAtMs) },
    { name: "claims", pending: claimPending, attention: claimAttention, activeLeases: claimActiveLeases, oldestPendingAgeMs: claimAge, pressure: queuePressure(claimPending, claimAge, countElevatedAt, countHighAt, ageElevatedAtMs, ageHighAtMs) },
    { name: "fees", pending: feePending, attention: feeAttention, activeLeases: feeActiveLeases, oldestPendingAgeMs: feeAge, pressure: queuePressure(feePending, feeAge, countElevatedAt, countHighAt, ageElevatedAtMs, ageHighAtMs) },
  ];
}

export async function getOperationsStatus(input: { maxWorkerAgeMs?: number } = {}): Promise<OperationsStatus> {
  const maxWorkerAgeMs = Math.max(5_000, Math.min(300_000, input.maxWorkerAgeMs ?? 60_000));
  const [database, workerSnapshot, maintenance] = await Promise.all([
    databaseReady(),
    getWorkerReadiness({ requiredTypes: [...REQUIRED_WORKER_KINDS], maxAgeMs: maxWorkerAgeMs }).catch(() => ({
      ready: false,
      maxAgeMs: maxWorkerAgeMs,
      workers: REQUIRED_WORKER_KINDS.map((type) => ({ type, ready: false, ageMs: null, heartbeatAt: null, version: null })),
    })),
    readWorkerMaintenanceState(),
  ]);
  const draining = maintenance.draining;

  const observed = workerSnapshot.workers.filter((worker) => worker.heartbeatAt !== null).length;
  const readyCount = workerSnapshot.workers.filter((worker) => worker.ready).length;
  const missing = workerSnapshot.workers.filter((worker) => worker.heartbeatAt === null).map((worker) => worker.type);
  const stale = workerSnapshot.workers.filter((worker) => worker.heartbeatAt !== null && !worker.ready).map((worker) => worker.type);
  const workers = {
    ...workerSnapshot,
    expected: REQUIRED_WORKER_KINDS.length,
    observed,
    readyCount,
    missing,
    stale,
  };

  let queues: QueueSnapshot[] = [];
  if (database) queues = await queueSnapshot();
  const attention = queues.reduce((sum, queue) => sum + queue.attention, 0);
  const queuePressureState = queues.reduce<QueuePressure>((current, queue) => pressureRank(queue.pressure) > pressureRank(current) ? queue.pressure : current, "normal");
  const activeLeases = queues.reduce((sum, queue) => sum + queue.activeLeases, 0);
  const quiescent = draining && activeLeases === 0;
  const state: OperationalState = !database ? "blocked" : draining || !workers.ready || attention > 0 || queuePressureState !== "normal" ? "degraded" : "healthy";
  return {
    state,
    database: { ready: database },
    workers,
    queues,
    queuePressure: queuePressureState,
    maintenance: { draining, activeLeases, quiescent, source: maintenance.source, revision: maintenance.revision, readHealthy: maintenance.readHealthy, checkedAt: maintenance.checkedAt, lastSuccessfulReadAt: maintenance.lastSuccessfulReadAt, cacheAgeMs: maintenance.cacheAgeMs },
    checkedAt: new Date().toISOString(),
    authoritativeForBridgeAccounting: false,
  };
}


export async function getOperatorAttentionQueue(input: {
  limit?: number;
  queue?: OperatorAttentionQueue;
  before?: Date;
} = {}): Promise<OperatorAttentionPage> {
  const limit = Math.max(1, Math.min(100, Math.trunc(input.limit ?? 50)));
  const selectedQueues: readonly OperatorAttentionQueue[] = input.queue ? [input.queue] : ["bridge", "claims", "fees"];
  const beforeWhere = input.before ? { updatedAt: { lt: input.before } } : {};
  const take = limit + 1;

  const [bridgeCount, claimCount, feeCount, bridge, claims, fees] = await Promise.all([
    prisma.bridgeTransfer.count({ where: { status: { in: ["RECONCILIATION_REQUIRED", "FAILED"] } } }),
    prisma.claim.count({ where: { status: { in: ["FAILED", "UNKNOWN"] } } }),
    prisma.bridgeServiceFeeSettlement.count({ where: { status: { in: ["FAILED", "MANUAL_REVIEW"] } } }),
    selectedQueues.includes("bridge")
      ? prisma.bridgeTransfer.findMany({
          where: { status: { in: ["RECONCILIATION_REQUIRED", "FAILED"] }, ...beforeWhere },
          orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
          take,
          select: { id: true, status: true, failureCode: true, bridgeAttemptCount: true, updatedAt: true },
        })
      : Promise.resolve([]),
    selectedQueues.includes("claims")
      ? prisma.claim.findMany({
          where: { status: { in: ["FAILED", "UNKNOWN"] }, ...beforeWhere },
          orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
          take,
          select: { id: true, status: true, failureCode: true, attemptCount: true, updatedAt: true },
        })
      : Promise.resolve([]),
    selectedQueues.includes("fees")
      ? prisma.bridgeServiceFeeSettlement.findMany({
          where: { status: { in: ["FAILED", "MANUAL_REVIEW"] }, ...beforeWhere },
          orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
          take,
          select: { id: true, status: true, failureCode: true, attemptCount: true, updatedAt: true },
        })
      : Promise.resolve([]),
  ]);

  const merged: OperatorAttentionItem[] = [
    ...bridge.map((row: BridgeAttentionRow) => ({ queue: "bridge" as const, id: row.id, status: row.status, failureCode: row.failureCode, attemptCount: row.bridgeAttemptCount, updatedAt: row.updatedAt.toISOString() })),
    ...claims.map((row: ClaimAttentionRow) => ({ queue: "claims" as const, id: row.id, status: row.status, failureCode: row.failureCode, attemptCount: row.attemptCount, updatedAt: row.updatedAt.toISOString() })),
    ...fees.map((row: FeeAttentionRow) => ({ queue: "fees" as const, id: row.id, status: row.status, failureCode: row.failureCode, attemptCount: row.attemptCount, updatedAt: row.updatedAt.toISOString() })),
  ].sort((a, b) => {
    const byTime = b.updatedAt.localeCompare(a.updatedAt);
    return byTime !== 0 ? byTime : b.id.localeCompare(a.id);
  });

  const hasMore = merged.length > limit;
  const items = merged.slice(0, limit);
  return {
    items,
    summary: { bridge: bridgeCount, claims: claimCount, fees: feeCount },
    nextBefore: hasMore && items.length > 0 ? items[items.length - 1]!.updatedAt : null,
    checkedAt: new Date().toISOString(),
    authoritativeForSettlement: false,
  };
}
