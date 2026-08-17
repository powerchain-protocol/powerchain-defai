import { NextResponse } from "next/server";
import { responseHeaders } from "@/server/http";
import { validateClaimMutationRequest } from "@/server/http/claim-mutation-contract";
import { enforceBridgeRuntimeRequest } from "@/server/http/bridge-runtime-guard";
import { submitReservedClaim } from "@powerchain/backend/claims";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const runtimeBlocked = await enforceBridgeRuntimeRequest("claim"); if (runtimeBlocked) return runtimeBlocked;
  const contract = await validateClaimMutationRequest(request, "submit"); if (!contract.ok) return contract.response;
  try {
    const claim = await submitReservedClaim({ raw: await request.json(), idempotencyKey: contract.idempotencyKey });
    return NextResponse.json(
      { data: { id: claim.id, wallet: claim.wallet, status: claim.status, amountBaseUnits: claim.amountBaseUnits.toFixed(0) }, requestId: contract.requestId },
      { status: 202, headers: responseHeaders(contract.requestId, { location: `/claims/status/${claim.id}` }) },
    );
  } catch (error) {
    const code = error instanceof Error ? error.message : "CLAIM_SUBMIT_FAILED";
    const status = code.includes("NOT_FOUND") ? 404 : code.includes("EXPIRED") || code.includes("FAILED") || code.includes("REUSED") ? 409 : code.includes("INVALID") || code.includes("REQUIRED") ? 422 : 500;
    return NextResponse.json({ error: code, requestId: contract.requestId }, { status, headers: responseHeaders(contract.requestId) });
  }
}
