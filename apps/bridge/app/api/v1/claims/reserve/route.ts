import { NextResponse } from "next/server";
import { responseHeaders } from "@/server/http";
import { validateClaimMutationRequest } from "@/server/http/claim-mutation-contract";
import { enforceBridgeRuntimeRequest } from "@/server/http/bridge-runtime-guard";
import { reserveClaim } from "@powerchain/backend";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const runtimeBlocked = await enforceBridgeRuntimeRequest("claim"); if (runtimeBlocked) return runtimeBlocked;
  const contract = await validateClaimMutationRequest(request, "reserve"); if (!contract.ok) return contract.response;
  try {
    const claim = await reserveClaim({ raw: await request.json(), idempotencyKey: contract.idempotencyKey });
    return NextResponse.json(
      { data: { id: claim.id, wallet: claim.wallet, status: claim.status, amountBaseUnits: claim.amountBaseUnits.toFixed(0), reservationExpiresAt: claim.reservationExpiresAt.toISOString() }, requestId: contract.requestId },
      { status: 201, headers: responseHeaders(contract.requestId, { location: `/claims/status/${claim.id}` }) },
    );
  } catch (error) {
    const code = error instanceof Error ? error.message : "CLAIM_RESERVE_FAILED";
    const status = code.includes("NOT_ELIGIBLE") ? 403 : code.includes("INVALID") || code.includes("REQUIRED") ? 422 : code.includes("RESERVED") || code.includes("USED") || code.includes("REUSED") ? 409 : 500;
    return NextResponse.json({ error: code, requestId: contract.requestId }, { status, headers: responseHeaders(contract.requestId) });
  }
}
