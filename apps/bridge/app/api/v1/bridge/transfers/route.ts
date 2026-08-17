import { NextResponse } from "next/server";
import { bridgeStatusRoute } from "@/config/app-routes";
import { responseHeaders, safeErrorCode } from "@/server/http";
import { validateBridgeMutationRequest } from "@/server/http/bridge-mutation-contract";
import { enforceBridgeRuntimeRequest } from "@/server/http/bridge-runtime-guard";
import { createBridgeTransfer } from "@/server/services/bridge-operations";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const contract = await validateBridgeMutationRequest(request, "transfer-submit");
  if (!contract.ok) return contract.response;
  const runtimeBlocked = await enforceBridgeRuntimeRequest("transfer-submit");
  if (runtimeBlocked) return runtimeBlocked;

  try {
    const transfer = await createBridgeTransfer({ raw: await request.json(), idempotencyKey: contract.context.idempotencyKey! });
    return NextResponse.json(
      { data: { ...transfer, principalBaseUnits: transfer.principalBaseUnits.toFixed(0) }, requestId: contract.context.requestId },
      { status: 201, headers: responseHeaders(contract.context.requestId, { location: bridgeStatusRoute(transfer.id) }) },
    );
  } catch (error) {
    const code = safeErrorCode(error, "TRANSFER_CREATE_FAILED");
    const status = code.includes("NOT_FOUND") ? 404
      : code.includes("EXPIRED") || code.includes("MISMATCH") || code.includes("REUSED") || code.includes("ALREADY_USED") || code.includes("STALE") ? 409
        : code.includes("BLOCKED") ? 503
          : code.includes("INVALID") ? 422
            : 500;
    return NextResponse.json(
      { error: code, message: status >= 500 ? "Bridge transfer could not be created at this time" : "Bridge transfer request could not be accepted", requestId: contract.context.requestId },
      { status, headers: responseHeaders(contract.context.requestId) },
    );
  }
}
