import { getRuntimeMaintenanceState, type RuntimeMaintenanceSnapshot } from "@powerchain/database";
import { parseBoundedInteger } from "@powerchain/runtime";

export type WorkerMaintenanceSource = "environment-override" | "database" | "database-unavailable";

export type WorkerMaintenanceSnapshot = RuntimeMaintenanceSnapshot & Readonly<{
  source: WorkerMaintenanceSource;
  readHealthy: boolean;
  checkedAt: string;
  lastSuccessfulReadAt: string | null;
  cacheAgeMs: number;
}>;

function envDrainOverride(): boolean {
  return ["1", "true", "yes", "on"].includes((process.env.POWERCHAIN_WORKER_DRAIN_MODE ?? "").trim().toLowerCase());
}

function maintenanceReadTimeoutMs(): number {
  return parseBoundedInteger(process.env.POWERCHAIN_WORKER_MAINTENANCE_TIMEOUT_MS, 1_500, { min: 250, max: 10_000 });
}

async function withTimeout<T>(run: () => Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      run(),
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error("MAINTENANCE_STATE_TIMEOUT")), timeoutMs);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

export async function readWorkerMaintenanceState(previous?: WorkerMaintenanceSnapshot): Promise<WorkerMaintenanceSnapshot> {
  const checkedAt = new Date().toISOString();
  if (envDrainOverride()) {
    return {
      draining: true,
      revision: previous?.revision ?? 0,
      reason: "POWERCHAIN_WORKER_DRAIN_MODE override",
      updatedBy: previous?.updatedBy ?? null,
      requestId: previous?.requestId ?? null,
      updatedAt: previous?.updatedAt ?? null,
      source: "environment-override",
      readHealthy: true,
      checkedAt,
      lastSuccessfulReadAt: previous?.lastSuccessfulReadAt ?? checkedAt,
      cacheAgeMs: 0,
    };
  }

  try {
    const state = await withTimeout(() => getRuntimeMaintenanceState(), maintenanceReadTimeoutMs());
    return {
      ...state,
      source: "database",
      readHealthy: true,
      checkedAt,
      lastSuccessfulReadAt: checkedAt,
      cacheAgeMs: 0,
    };
  } catch {
    const lastSuccessfulReadAt = previous?.lastSuccessfulReadAt ?? null;
    const cacheAgeMs = lastSuccessfulReadAt === null ? 0 : Math.max(0, Date.now() - Date.parse(lastSuccessfulReadAt));
    return {
      draining: true,
      revision: previous?.revision ?? 0,
      reason: "MAINTENANCE_STATE_UNAVAILABLE",
      updatedBy: previous?.updatedBy ?? null,
      requestId: previous?.requestId ?? null,
      updatedAt: previous?.updatedAt ?? null,
      source: "database-unavailable",
      readHealthy: false,
      checkedAt,
      lastSuccessfulReadAt,
      cacheAgeMs,
    };
  }
}

export function createWorkerMaintenanceGuard() {
  let cached: WorkerMaintenanceSnapshot | undefined;
  let cachedAt = 0;
  const refreshMs = parseBoundedInteger(process.env.POWERCHAIN_WORKER_MAINTENANCE_REFRESH_MS, 2_000, { min: 500, max: 30_000 });

  return async function maintenanceState(force = false): Promise<WorkerMaintenanceSnapshot> {
    if (envDrainOverride()) {
      cached = await readWorkerMaintenanceState(cached);
      cachedAt = Date.now();
      return cached;
    }
    const now = Date.now();
    if (!force && cached && now - cachedAt < refreshMs) {
      return { ...cached, cacheAgeMs: Math.max(0, now - cachedAt) };
    }
    cached = await readWorkerMaintenanceState(cached);
    cachedAt = now;
    return cached;
  };
}
