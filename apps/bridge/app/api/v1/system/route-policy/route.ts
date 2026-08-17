import { routePolicyDiagnostics } from "@powerchain/backend/routing";
import { ok, requestId } from "@/server/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export function GET(req: Request) {
  return ok(routePolicyDiagnostics(), 200, requestId(req), {
    "Cache-Control": "no-store, max-age=0",
    "X-PowerChain-Diagnostics-Scope": "process-local",
  });
}
