import { exportServiceFeeLedgerCsv } from "@powerchain/backend";
import { fail, requestId } from "@/server/http";
import { requireServiceFeeOperator } from "@/server/service-fee-auth";

export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const id = requestId(req);
  try {
    requireServiceFeeOperator(req);
    const url = new URL(req.url);
    const days = Math.max(1, Math.min(365, Number(url.searchParams.get("days") ?? 30)));
    const limit = Math.max(1, Math.min(10_000, Number(url.searchParams.get("limit") ?? 5000)));
    const result = await exportServiceFeeLedgerCsv({ since: new Date(Date.now() - days * 86_400_000), limit });
    return new Response(result.csv, { status: 200, headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="powerchain-service-fees.csv"',
      "Cache-Control": "no-store",
      "X-Request-Id": id,
      "X-PowerChain-Export-Rows": String(result.rows),
      "X-PowerChain-Export-Truncated": String(result.truncated),
    }});
  } catch (error) {
    const code = error instanceof Error ? error.message : "SERVICE_FEE_EXPORT_FAILED";
    return fail(code, code === "OPERATOR_UNAUTHORIZED" ? "Unauthorized" : code, code === "OPERATOR_UNAUTHORIZED" ? 401 : 503, id, code !== "OPERATOR_UNAUTHORIZED");
  }
}
