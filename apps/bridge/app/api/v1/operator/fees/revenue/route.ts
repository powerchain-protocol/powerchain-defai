import { serviceFeeRevenueReport, serviceFeeOperationalMetrics } from "@powerchain/backend";
import { fail, ok, requestId } from "@/server/http";
import { enforceRateLimit } from "@/server/rate-limiter";
import { requireServiceFeeOperator } from "@/server/service-fee-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const id = requestId(req);
  try {
    const actor = requireServiceFeeOperator(req);
    const rate = await enforceRateLimit("operator", req.headers, actor);
    if (!rate.allowed) return fail("RATE_LIMITED", "Too many operator requests", 429, id, true);
    const url = new URL(req.url);
    const days = Math.max(1, Math.min(365, Number(url.searchParams.get("days") ?? 30)));
    const since = new Date(Date.now() - days * 86_400_000);
    const [revenue, operations] = await Promise.all([serviceFeeRevenueReport({ since }), serviceFeeOperationalMetrics()]);
    return ok({ days, revenue, operations }, 200, id);
  } catch (error) {
    const code = error instanceof Error ? error.message : "SERVICE_FEE_REVENUE_QUERY_FAILED";
    return fail(code, code === "OPERATOR_UNAUTHORIZED" ? "Unauthorized" : "Unable to load service fee revenue", code === "OPERATOR_UNAUTHORIZED" ? 401 : 503, id, code !== "OPERATOR_UNAUTHORIZED");
  }
}
