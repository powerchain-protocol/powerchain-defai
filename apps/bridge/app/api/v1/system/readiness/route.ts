import { checkSystemReadiness } from "@/server/services/system-readiness";
import { ok, requestId } from "@/server/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const id = requestId(req);
  try {
    const readiness = await checkSystemReadiness();
    return ok(readiness, readiness.state === "blocked" ? 503 : 200, id, {
      "Cache-Control": "no-store, max-age=0",
      "X-PowerChain-System-Readiness": readiness.state,
      ...(readiness.state === "blocked" ? { "Retry-After": "5" } : {}),
    });
  } catch {
    return ok({
      state: "blocked",
      checkedAt: new Date().toISOString(),
      productionMode: process.env.NODE_ENV === "production",
      capabilities: { reads: false, newOperations: false, asyncSettlement: false },
      checks: {
        database: { ready: false },
        providers: { ready: false, degraded: false },
        workers: { ready: false, observed: 0, readyCount: 0, expected: 3, missing: ["bridge", "claims", "fees"], stale: [] },
        queues: { attention: 0, pending: 0, oldestPendingAgeMs: null, pressure: "high" },
        routePolicy: { pressure: "high", utilization: 1 },
        maintenance: {
          draining: true,
          activeLeases: 0,
          quiescent: false,
          source: "database-unavailable",
          revision: 0,
          readHealthy: false,
          checkedAt: new Date().toISOString(),
          lastSuccessfulReadAt: null,
          cacheAgeMs: 0,
        },
      },
      authoritativeForBalances: false,
      authoritativeForSettlement: false,
    }, 503, id, {
      "Cache-Control": "no-store, max-age=0",
      "Retry-After": "5",
      "X-PowerChain-System-Readiness": "blocked",
    });
  }
}
