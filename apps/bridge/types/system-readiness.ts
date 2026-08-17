export type SystemReadinessState = "ready" | "degraded" | "blocked";

export type SystemReadinessPayload = Readonly<{
  state: SystemReadinessState;
  checkedAt: string;
  productionMode: boolean;
  capabilities: Readonly<{
    reads: boolean;
    newOperations: boolean;
    asyncSettlement: boolean;
  }>;
  checks: Readonly<{
    database: Readonly<{ ready: boolean }>;
    providers: Readonly<{ ready: boolean; degraded: boolean }>;
    workers: Readonly<{
      ready: boolean;
      observed: number;
      readyCount: number;
      expected: number;
      missing: readonly string[];
      stale: readonly string[];
    }>;
    queues: Readonly<{ attention: number; pending: number; oldestPendingAgeMs: number | null; pressure: "normal" | "elevated" | "high" }>;
    routePolicy: Readonly<{ pressure: "normal" | "elevated" | "high"; utilization: number }>;
    maintenance: Readonly<{ draining: boolean; activeLeases: number; quiescent: boolean; source: "environment-override" | "database" | "database-unavailable"; revision: number; readHealthy: boolean; checkedAt: string; lastSuccessfulReadAt: string | null; cacheAgeMs: number }>;
  }>;
  authoritativeForBalances: false;
  authoritativeForSettlement: false;
}>;
