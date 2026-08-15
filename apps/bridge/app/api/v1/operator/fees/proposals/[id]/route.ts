import { fail, json, ok, requestId } from "@/server/http";
import { enforceRateLimit } from "@/server/rate-limiter";
import { requireServiceFeeGovernance } from "@/server/service-fee-auth";
import { applyServiceFeePolicyProposal, rejectServiceFeePolicyProposal } from "@/server/service-fees";

export const dynamic = "force-dynamic";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const request = requestId(req);
  try {
    const actor = requireServiceFeeGovernance(req);
    const rate = await enforceRateLimit("operator", req.headers, actor);
    if (!rate.allowed) return fail("RATE_LIMITED", "Too many governance requests", 429, request, true);
    const { id } = await context.params;
    const body = await json(req) as Record<string, unknown>;
    const action = String(body?.action ?? "").toUpperCase();
    if (action === "APPLY") {
      const policy = await applyServiceFeePolicyProposal({ id, approvedBy: actor, requestId: request });
      return ok({ proposalId: id, status: "APPLIED", policyId: policy.id, version: policy.version }, 200, request);
    }
    if (action === "REJECT") {
      const reason = typeof body.reason === "string" && body.reason.trim() ? body.reason.trim() : undefined;
      const proposal = await rejectServiceFeePolicyProposal({ id, approvedBy: actor, requestId: request, ...(reason ? { reason } : {}) });
      return ok({ proposalId: proposal.id, status: proposal.status }, 200, request);
    }
    return fail("GOVERNANCE_ACTION_INVALID", "action must be APPLY or REJECT", 422, request, false);
  } catch (error) {
    const code = error instanceof Error ? error.message : "SERVICE_FEE_GOVERNANCE_FAILED";
    const unauthorized = code === "GOVERNANCE_UNAUTHORIZED";
    const conflict = code.includes("DUAL_CONTROL") || code.includes("PROPOSAL_APPLIED") || code.includes("PROPOSAL_REJECTED") || code.includes("PROPOSAL_EXPIRED");
    return fail(code, unauthorized ? "Unauthorized" : "Unable to apply service fee governance action", unauthorized ? 401 : conflict ? 409 : 422, request, false);
  }
}
