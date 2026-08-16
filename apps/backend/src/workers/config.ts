import "server-only";

export type WorkerKind = "bridge" | "claims" | "fees";
export type WorkerRuntimeConfig = { workerId: string; idleMs: number; leaseMs: number; batchSize: number };
function bounded(raw: string | undefined, fallback: number, min: number, max: number) { const n=Number(raw); return Number.isFinite(n) ? Math.max(min, Math.min(Math.trunc(n), max)) : fallback; }
export function workerRuntimeConfig(kind: WorkerKind): WorkerRuntimeConfig {
  const pid = process.pid;
  if (kind === "bridge") return { workerId: process.env.POWERCHAIN_BRIDGE_WORKER_ID?.trim() || `bridge-${pid}`, idleMs: bounded(process.env.POWERCHAIN_BRIDGE_WORKER_INTERVAL_MS,5000,1000,300000), leaseMs: bounded(process.env.POWERCHAIN_BRIDGE_WORKER_LEASE_MS,90000,20000,300000), batchSize: bounded(process.env.POWERCHAIN_BRIDGE_WORKER_BATCH_SIZE,25,1,100) };
  if (kind === "claims") return { workerId: process.env.POWERCHAIN_CLAIM_WORKER_ID?.trim() || `claim-${pid}`, idleMs: bounded(process.env.POWERCHAIN_CLAIM_WORKER_INTERVAL_MS,5000,1000,300000), leaseMs: bounded(process.env.POWERCHAIN_CLAIM_WORKER_LEASE_MS,60000,10000,300000), batchSize: bounded(process.env.POWERCHAIN_CLAIM_WORKER_BATCH_SIZE,50,1,100) };
  return { workerId: process.env.POWERCHAIN_FEE_WORKER_ID?.trim() || `fee-${pid}`, idleMs: bounded(process.env.POWERCHAIN_FEE_WORKER_INTERVAL_MS,5000,1000,300000), leaseMs: bounded(process.env.POWERCHAIN_FEE_WORKER_LEASE_MS,60000,10000,300000), batchSize: bounded(process.env.POWERCHAIN_FEE_WORKER_BATCH_SIZE,100,1,250) };
}
