import { serviceFeeIntegrityReport } from "@powerchain/backend";
import { fail, ok, requestId } from "@/server/http";
import { requireServiceFeeOperator } from "@/server/service-fee-auth";

export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const id = requestId(req);
  try {
    requireServiceFeeOperator(req);
    const url = new URL(req.url);
    const days = Math.max(1, Math.min(365, Number(url.searchParams.get("days") ?? 30)));
    const limit = Math.max(1, Math.min(5000, Number(url.searchParams.get("limit") ?? 2500)));
    const report = await serviceFeeIntegrityReport({ since: new Date(Date.now() - days * 86_400_000), limit });
    return ok(report, report.healthy ? 200 : 409, id, { "Cache-Control": "no-store" });
  } catch (error) {
    const code = error instanceof Error ? error.message : "SERVICE_FEE_RECONCILIATION_FAILED";
    return fail(code, code === "OPERATOR_UNAUTHORIZED" ? "Unauthorized" : code, code === "OPERATOR_UNAUTHORIZED" ? 401 : 503, id, code !== "OPERATOR_UNAUTHORIZED");
  }
}
