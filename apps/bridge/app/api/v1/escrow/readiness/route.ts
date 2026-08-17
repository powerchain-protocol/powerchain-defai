import { verifyEscrowRuntimeStatus } from "@powerchain/backend/escrow/config";
import { fail, ok, requestId } from "@/server/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const id = requestId(req);
  const status = await verifyEscrowRuntimeStatus();
  return status.executable && status.verified
    ? ok({ ...status, authoritativeForSettlement: false }, 200, id, { "x-powerchain-escrow-readiness": "verified" })
    : fail("ESCROW_NOT_VERIFIED", "Escrow remains fail-closed until the deployed program is verified by runtime RPC checks.", 503, id, true, { ...status, authoritativeForSettlement: false });
}
