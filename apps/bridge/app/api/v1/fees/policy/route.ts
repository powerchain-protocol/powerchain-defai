import { prisma } from "@powerchain/database/prisma";
import { fail, ok, requestId } from "@/server/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const id = requestId(req);
  try {
    const url = new URL(req.url);
    const routeId = url.searchParams.get("routeId")?.trim() ?? "";
    const sourceChain = url.searchParams.get("sourceChain")?.trim().toUpperCase() ?? "";
    if (!routeId || (sourceChain !== "SOLANA" && sourceChain !== "SUI")) return fail("SERVICE_FEE_POLICY_QUERY_INVALID", "routeId and sourceChain are required", 422, id, false);
    const policy = await prisma.bridgeServiceFeePolicy.findFirst({ where: { routeId, sourceChain: sourceChain as "SOLANA" | "SUI", enabled: true, effectiveFrom: { lte: new Date() } }, orderBy: { version: "desc" } });
    if (!policy) return fail("SERVICE_FEE_POLICY_UNAVAILABLE", "Service fee policy is unavailable for this route", 503, id, true);
    return ok({
      routeId: policy.routeId,
      sourceChain: policy.sourceChain,
      assetId: policy.assetId,
      feeBps: policy.feeBps,
      recipient: policy.recipient,
      version: policy.version,
      minFeeBaseUnits: policy.minFeeBaseUnits?.toFixed(0) ?? null,
      maxFeeBaseUnits: policy.maxFeeBaseUnits?.toFixed(0) ?? null,
      effectiveFrom: policy.effectiveFrom.toISOString(),
    }, 200, id);
  } catch {
    return fail("SERVICE_FEE_POLICY_QUERY_FAILED", "Unable to load service fee policy", 503, id, true);
  }
}
