import "server-only";

import { getOperationsStatus } from "@powerchain/backend/services/operations";
import { routePolicyDiagnostics } from "@powerchain/backend/routing";
import { parseBoundedInteger } from "@powerchain/runtime";
import { checkProviderReadiness } from "./provider-health";
import type { SystemReadinessPayload, SystemReadinessState } from "@/types/system-readiness";

export async function checkSystemReadiness(): Promise<SystemReadinessPayload> {
  const maxWorkerAgeMs = parseBoundedInteger(process.env.POWERCHAIN_WORKER_HEARTBEAT_MAX_AGE_MS, 60_000, {
    min: 5_000,
    max: 300_000,
  });

  const [operationsResult, providersResult] = await Promise.allSettled([
    getOperationsStatus({ maxWorkerAgeMs }),
    checkProviderReadiness(),
  ]);

  const operations = operationsResult.status === "fulfilled" ? operationsResult.value : undefined;
  const providers = providersResult.status === "fulfilled" ? providersResult.value : undefined;
  const policy = routePolicyDiagnostics();

  const databaseReady = operations?.database.ready === true;
  const providerReady = providers?.ready === true;
  const providerDegraded = providers?.degraded === true;
  const workerExpected = operations?.workers.expected ?? 3;
  const workerObserved = operations?.workers.observed ?? 0;
  const workerReadyCount = operations?.workers.readyCount ?? 0;
  const missingWorkers = operations?.workers.missing ?? ["bridge", "claims", "fees"];
  const staleWorkers = operations?.workers.stale ?? [];
  const workersReady = operations?.workers.ready === true && workerReadyCount === workerExpected;
  const queueAttention = operations?.queues.reduce((sum, queue) => sum + queue.attention, 0) ?? 0;
  const queuePending = operations?.queues.reduce((sum, queue) => sum + queue.pending, 0) ?? 0;
  const queuePressure = operations?.queuePressure ?? "high";
  const activeLeases = operations?.maintenance.activeLeases ?? 0;
  const quiescent = operations?.maintenance.quiescent ?? false;
  const draining = operations?.maintenance.draining ?? true;
  const maintenance = operations?.maintenance ?? { draining: true, activeLeases: 0, quiescent: false, source: "database-unavailable" as const, revision: 0, readHealthy: false, checkedAt: new Date().toISOString(), lastSuccessfulReadAt: null, cacheAgeMs: 0 };
  const oldestPendingAgeMs = operations?.queues.reduce<number | null>((oldest, queue) => queue.oldestPendingAgeMs === null ? oldest : oldest === null ? queue.oldestPendingAgeMs : Math.max(oldest, queue.oldestPendingAgeMs), null) ?? null;

  const reads = providerReady;
  const newOperations = databaseReady && providerReady && !draining;
  const asyncSettlement = newOperations && workersReady && queuePressure !== "high";

  let state: SystemReadinessState = "ready";
  if (!newOperations) state = "blocked";
  else if (!asyncSettlement || providerDegraded || queueAttention > 0 || queuePressure !== "normal" || policy.limiter.pressure !== "normal") state = "degraded";

  return {
    state,
    checkedAt: new Date().toISOString(),
    productionMode: process.env.NODE_ENV === "production",
    capabilities: { reads, newOperations, asyncSettlement },
    checks: {
      database: { ready: databaseReady },
      providers: { ready: providerReady, degraded: providerDegraded },
      workers: {
        ready: workersReady,
        observed: workerObserved,
        readyCount: workerReadyCount,
        expected: workerExpected,
        missing: missingWorkers,
        stale: staleWorkers,
      },
      queues: { attention: queueAttention, pending: queuePending, oldestPendingAgeMs, pressure: queuePressure },
      routePolicy: { pressure: policy.limiter.pressure, utilization: policy.limiter.utilization },
      maintenance: { ...maintenance, draining, activeLeases, quiescent },
    },
    authoritativeForBalances: false,
    authoritativeForSettlement: false,
  };
}
