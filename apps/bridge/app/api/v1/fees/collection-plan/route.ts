import { assessActiveServiceFee, totalSourceDebitBaseUnits, type ServiceFeeChain } from "@powerchain/backend";
import { fail, ok, requestId } from "@/server/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const id = requestId(req);
  try {
    const url = new URL(req.url);
    const routeId = url.searchParams.get("routeId")?.trim() ?? "";
    const sourceChain = url.searchParams.get("sourceChain")?.trim().toUpperCase() as ServiceFeeChain;
    const principalBaseUnits = url.searchParams.get("principalBaseUnits")?.trim() ?? "";
    if (!routeId || (sourceChain !== "SOLANA" && sourceChain !== "SUI") || !/^[1-9][0-9]*$/.test(principalBaseUnits)) {
      return fail("SERVICE_FEE_PLAN_QUERY_INVALID", "routeId, sourceChain and a positive principalBaseUnits value are required", 422, id, false);
    }
    const assessment = await assessActiveServiceFee({ routeId, sourceChain, principalBaseUnits });
    return ok({
      policyId: assessment.policyId,
      policyVersion: assessment.policyVersion,
      routeId: assessment.routeId,
      sourceChain: assessment.sourceChain,
      assetId: assessment.assetId,
      principalBaseUnits: assessment.principalBaseUnits,
      feeBps: assessment.feeBps,
      feeBaseUnits: assessment.feeBaseUnits,
      recipient: assessment.recipient,
      commitment: assessment.commitment,
      totalSourceDebitBaseUnits: totalSourceDebitBaseUnits(assessment.principalBaseUnits, assessment.feeBaseUnits),
      principalRule: "1:1",
      signing: "wallet",
      authoritativeForBridgePrincipal: false,
    }, 200, id);
  } catch (error) {
    const code = error instanceof Error ? error.message : "SERVICE_FEE_PLAN_UNAVAILABLE";
    return fail(code, "Unable to build service-fee collection plan", 503, id, true);
  }
}
