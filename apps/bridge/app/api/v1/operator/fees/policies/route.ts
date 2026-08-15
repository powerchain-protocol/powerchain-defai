import { fail, ok, requestId } from "@/server/http";
import { enforceRateLimit } from "@/server/rate-limiter";
import { requireServiceFeeOperator } from "@/server/service-fee-auth";
import { listServiceFeePolicyHistory } from "@/server/service-fees";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const id = requestId(req);
  try {
    const actor = requireServiceFeeOperator(req);
    const rate = await enforceRateLimit("operator", req.headers, actor);
    if (!rate.allowed) return fail("RATE_LIMITED", "Too many operator requests", 429, id, true);
    const url = new URL(req.url);
    const source = url.searchParams.get("sourceChain")?.toUpperCase();
    if (source && source !== "SOLANA" && source !== "SUI") return fail("SERVICE_FEE_CHAIN_INVALID", "sourceChain must be SOLANA or SUI", 422, id, false);
    const policies = await listServiceFeePolicyHistory({
      ...(url.searchParams.get("routeId") ? { routeId: url.searchParams.get("routeId")!.trim() } : {}),
      ...(source ? { sourceChain: source as "SOLANA" | "SUI" } : {}),
      limit: Number(url.searchParams.get("limit") ?? 100),
    });
    return ok({ policies }, 200, id);
  } catch (error) {
    const code = error instanceof Error ? error.message : "SERVICE_FEE_POLICY_HISTORY_QUERY_FAILED";
    return fail(code, code === "OPERATOR_UNAUTHORIZED" ? "Unauthorized" : "Unable to load service fee policy history", code === "OPERATOR_UNAUTHORIZED" ? 401 : 503, id, code !== "OPERATOR_UNAUTHORIZED");
  }
}
