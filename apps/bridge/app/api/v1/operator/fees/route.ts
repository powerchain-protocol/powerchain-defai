import { fail, json, ok, requestId } from "@/server/http";
import { enforceRateLimit } from "@/server/rate-limiter";
import { requireServiceFeeOperator } from "@/server/service-fee-auth";
import { createServiceFeePolicyProposal, serviceFeeSummary, validateServiceFeePolicyInput } from "@/server/service-fees";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const id = requestId(req);
  try {
    const actor = requireServiceFeeOperator(req);
    const rate = await enforceRateLimit("operator", req.headers, actor);
    if (!rate.allowed) return fail("RATE_LIMITED", "Too many operator requests", 429, id, true);
    return ok(await serviceFeeSummary(), 200, id);
  } catch (error) {
    const code = error instanceof Error ? error.message : "SERVICE_FEE_OPERATOR_QUERY_FAILED";
    return fail(code, code === "OPERATOR_UNAUTHORIZED" ? "Unauthorized" : "Unable to load service fee data", code === "OPERATOR_UNAUTHORIZED" ? 401 : 503, id, code !== "OPERATOR_UNAUTHORIZED");
  }
}

export async function POST(req: Request) {
  const id = requestId(req);
  try {
    const actor = requireServiceFeeOperator(req);
    const rate = await enforceRateLimit("operator", req.headers, actor);
    if (!rate.allowed) return fail("RATE_LIMITED", "Too many operator requests", 429, id, true);
    const payload = validateServiceFeePolicyInput(await json(req));
    const proposal = await createServiceFeePolicyProposal({ payload, proposedBy: actor, requestId: id, idempotencyKey: req.headers.get("idempotency-key") });
    return ok({ proposalId: proposal.id, status: proposal.status, kind: proposal.kind, expiresAt: proposal.expiresAt.toISOString() }, 202, id);
  } catch (error) {
    const code = error instanceof Error ? error.message : "SERVICE_FEE_POLICY_PROPOSAL_FAILED";
    const unauthorized = code === "OPERATOR_UNAUTHORIZED";
    const conflict = code === "GOVERNANCE_IDEMPOTENCY_KEY_REUSED";
    return fail(code, unauthorized ? "Unauthorized" : conflict ? "Idempotency key was already used for different policy contents" : "Unable to create service fee policy proposal", unauthorized ? 401 : conflict ? 409 : 422, id, false);
  }
}
