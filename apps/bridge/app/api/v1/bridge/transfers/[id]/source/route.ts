import { NextResponse } from "next/server";
import { bridgeStatusRoute } from "@/config/app-routes";
import { json, requestId, responseHeaders, safeErrorCode } from "@/server/http";
import { enforceBridgeRuntimeRequest } from "@/server/http/bridge-runtime-guard";
import { attachBridgeSourceTransaction } from "@/server/services/bridge-operations";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const runtime = await enforceBridgeRuntimeRequest("transfer-submit");
  if (runtime) return runtime;
  const { id } = await context.params;
  const rid = requestId(request);

  let body: unknown;
  try {
    body = await json(request, 16 * 1024);
  } catch (error) {
    const code = safeErrorCode(error, "INVALID_JSON");
    const status = code === "UNSUPPORTED_MEDIA_TYPE" ? 415 : code === "PAYLOAD_TOO_LARGE" ? 413 : 400;
    return NextResponse.json({ error: code, message: status === 415 ? "application/json is required" : status === 413 ? "Request body is too large" : "Request body must be valid JSON" }, { status, headers: responseHeaders(rid) });
  }

  const sourceTx = body && typeof body === "object" && !Array.isArray(body) && typeof (body as Record<string, unknown>).sourceTx === "string"
    ? String((body as Record<string, unknown>).sourceTx).trim()
    : "";
  if (!sourceTx || sourceTx.length > 128) {
    return NextResponse.json({ error: "SOURCE_TRANSACTION_INVALID", message: "Source transaction signature or digest is required" }, { status: 422, headers: responseHeaders(rid) });
  }

  try {
    const row = await attachBridgeSourceTransaction({ transferId: id, sourceTx });
    return NextResponse.json(
      { data: { id: row.id, status: row.status, sourceTx: row.sourceTx } },
      { status: 202, headers: responseHeaders(rid, { location: bridgeStatusRoute(row.id) }) },
    );
  } catch (error) {
    const code = safeErrorCode(error, "SOURCE_ATTACH_FAILED");
    const status = code.includes("NOT_FOUND") ? 404 : code.includes("ALREADY") || code.includes("REUSED") || code.includes("AWAITING") ? 409 : code.includes("INVALID") ? 422 : 500;
    return NextResponse.json(
      { error: code, message: status >= 500 ? "Source transaction could not be attached at this time" : "Source transaction could not be attached" },
      { status, headers: responseHeaders(rid) },
    );
  }
}
