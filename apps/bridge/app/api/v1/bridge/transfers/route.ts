import { NextResponse } from "next/server";
import { enforceBridgeRuntimeRequest } from "@/server/http/bridge-runtime-guard";
import { validateBridgeMutationRequest } from "@/server/http/bridge-mutation-contract";
import { createBridgeTransfer } from "@/server/services/bridge-operations";

export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const contract = await validateBridgeMutationRequest(request, "transfer-submit");
  if (!contract.ok) return contract.response;
  const runtimeBlocked = await enforceBridgeRuntimeRequest("transfer-submit");
  if (runtimeBlocked) return runtimeBlocked;
  try {
    const transfer = await createBridgeTransfer({ raw: await request.json(), idempotencyKey: contract.context.idempotencyKey! });
    return NextResponse.json({ data: { ...transfer, principalBaseUnits: transfer.principalBaseUnits.toFixed(0) }, requestId: contract.context.requestId }, { status: 201, headers: { "cache-control": "no-store, max-age=0", "x-request-id": contract.context.requestId, location: `/bridge/status/${transfer.id}` } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "TRANSFER_CREATE_FAILED";
    const status = code.includes("NOT_FOUND") ? 404 : code.includes("EXPIRED") || code.includes("MISMATCH") || code.includes("REUSED") || code.includes("ALREADY_USED") || code.includes("STALE") ? 409 : code.includes("BLOCKED") ? 503 : 500;
    return NextResponse.json({ error: code, requestId: contract.context.requestId }, { status, headers: { "cache-control": "no-store, max-age=0", "x-request-id": contract.context.requestId } });
  }
}
