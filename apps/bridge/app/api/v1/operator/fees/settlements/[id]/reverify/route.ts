import { prisma } from "@powerchain/database/prisma";
import { verifyServiceFeeForTransfer } from "@powerchain/backend";
import { fail, ok, requestId } from "@/server/http";
import { enforceRateLimit } from "@/server/rate-limiter";
import { requireServiceFeeOperator } from "@/server/service-fee-auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const request = requestId(req);
  try {
    const actor = requireServiceFeeOperator(req);
    const rate = await enforceRateLimit("operator", req.headers, actor);
    if (!rate.allowed) return fail("RATE_LIMITED", "Too many operator requests", 429, request, true);
    const { id } = await context.params;
    const settlement = await prisma.bridgeServiceFeeSettlement.findUnique({ where: { id }, select: { transferId: true, status: true } });
    if (!settlement) return fail("SERVICE_FEE_SETTLEMENT_NOT_FOUND", "Settlement not found", 404, request, false);
    if (settlement.status === "WAIVED") return fail("SERVICE_FEE_SETTLEMENT_WAIVED", "Waived settlement cannot be reverified", 409, request, false);
    const result = await verifyServiceFeeForTransfer(settlement.transferId);
    return ok({ settlementId: id, transferId: settlement.transferId, status: result.status }, 200, request);
  } catch (error) {
    const code = error instanceof Error ? error.message : "SERVICE_FEE_REVERIFY_FAILED";
    return fail(code, code === "OPERATOR_UNAUTHORIZED" ? "Unauthorized" : "Unable to reverify service fee", code === "OPERATOR_UNAUTHORIZED" ? 401 : 422, request, false);
  }
}
