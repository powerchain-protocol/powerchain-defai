import { prisma } from "@powerchain/database/prisma";
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
    const status = url.searchParams.get("status")?.toUpperCase();
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 50), 1), 100);
    const allowedStatuses = ["ASSESSED", "SUBMITTED", "VERIFIED", "FAILED", "RETRY_WAIT", "MANUAL_REVIEW", "WAIVED"] as const;
    type SettlementStatus = (typeof allowedStatuses)[number];
    const where = status && allowedStatuses.includes(status as SettlementStatus) ? { status: status as SettlementStatus } : {};
    const settlements = await prisma.bridgeServiceFeeSettlement.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: limit });
    return ok({ settlements: settlements.map((row) => ({ ...row, principalBaseUnits: row.principalBaseUnits.toFixed(0), feeBaseUnits: row.feeBaseUnits.toFixed(0), collectedBaseUnits: row.collectedBaseUnits?.toFixed(0) ?? null })) }, 200, id);
  } catch (error) {
    const code = error instanceof Error ? error.message : "SERVICE_FEE_LEDGER_QUERY_FAILED";
    return fail(code, code === "OPERATOR_UNAUTHORIZED" ? "Unauthorized" : "Unable to load service fee ledger", code === "OPERATOR_UNAUTHORIZED" ? 401 : 503, id, code !== "OPERATOR_UNAUTHORIZED");
  }
}
