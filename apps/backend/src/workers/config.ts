/**
 * Framework-neutral worker configuration. This module is executed directly by
 * Node/tsx workers, so it must not import Next.js `server-only`. Runtime
 * isolation is enforced by package boundaries and production checks instead.
 */
export const WORKER_KINDS = ["bridge", "claims", "fees"] as const;
export type WorkerKind = (typeof WORKER_KINDS)[number];

export const REQUIRED_WORKER_KINDS: readonly WorkerKind[] = WORKER_KINDS;

export type WorkerRuntimeConfig = {
  workerId: string;
  idleMs: number;
  leaseMs: number;
  batchSize: number;
  heartbeatMs: number;
};

function bounded(raw: string | undefined, fallback: number, min: number, max: number) {
  const n = Number(raw);
  return Number.isFinite(n) ? Math.max(min, Math.min(Math.trunc(n), max)) : fallback;
}

export function workerRuntimeConfig(kind: WorkerKind): WorkerRuntimeConfig {
  const pid = process.pid;
  if (kind === "bridge") {
    return {
      workerId: process.env.POWERCHAIN_BRIDGE_WORKER_ID?.trim() || `bridge-${pid}`,
      idleMs: bounded(process.env.POWERCHAIN_BRIDGE_WORKER_INTERVAL_MS, 5_000, 1_000, 300_000),
      leaseMs: bounded(process.env.POWERCHAIN_BRIDGE_WORKER_LEASE_MS, 90_000, 20_000, 300_000),
      batchSize: bounded(process.env.POWERCHAIN_BRIDGE_WORKER_BATCH_SIZE, 25, 1, 100),
      heartbeatMs: bounded(process.env.POWERCHAIN_WORKER_HEARTBEAT_INTERVAL_MS, 15_000, 5_000, 60_000),
    };
  }
  if (kind === "claims") {
    return {
      workerId: process.env.POWERCHAIN_CLAIM_WORKER_ID?.trim() || `claim-${pid}`,
      idleMs: bounded(process.env.POWERCHAIN_CLAIM_WORKER_INTERVAL_MS, 5_000, 1_000, 300_000),
      leaseMs: bounded(process.env.POWERCHAIN_CLAIM_WORKER_LEASE_MS, 60_000, 10_000, 300_000),
      batchSize: bounded(process.env.POWERCHAIN_CLAIM_WORKER_BATCH_SIZE, 50, 1, 100),
      heartbeatMs: bounded(process.env.POWERCHAIN_WORKER_HEARTBEAT_INTERVAL_MS, 15_000, 5_000, 60_000),
    };
  }
  return {
    workerId: process.env.POWERCHAIN_FEE_WORKER_ID?.trim() || `fee-${pid}`,
    idleMs: bounded(process.env.POWERCHAIN_FEE_WORKER_INTERVAL_MS, 5_000, 1_000, 300_000),
    leaseMs: bounded(process.env.POWERCHAIN_FEE_WORKER_LEASE_MS, 60_000, 10_000, 300_000),
    batchSize: bounded(process.env.POWERCHAIN_FEE_WORKER_BATCH_SIZE, 100, 1, 250),
    heartbeatMs: bounded(process.env.POWERCHAIN_WORKER_HEARTBEAT_INTERVAL_MS, 15_000, 5_000, 60_000),
  };
}
