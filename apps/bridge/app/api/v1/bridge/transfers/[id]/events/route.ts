import { NextResponse } from "next/server";
import { requestId, responseHeaders, safeErrorCode } from "@/server/http";
import { loadBridgeEventSnapshot } from "@/server/services/bridge-events";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");
  const legacyAfter = url.searchParams.get("after");
  const parsedAfter = legacyAfter && Number.isFinite(Date.parse(legacyAfter)) ? new Date(legacyAfter) : null;
  const rawLimit = Number.parseInt(url.searchParams.get("limit") ?? "50", 10);
  const limit = Math.min(100, Math.max(1, Number.isFinite(rawLimit) ? rawLimit : 50));
  const rid = requestId(request);

  try {
    const snapshot = await loadBridgeEventSnapshot(id, { cursor, after: parsedAfter, limit });
    return NextResponse.json({ data: snapshot }, { headers: responseHeaders(rid) });
  } catch (error) {
    const code = safeErrorCode(error, "TRANSFER_EVENTS_FAILED");
    const status = code.includes("NOT_FOUND") ? 404 : code.includes("INVALID") ? 400 : 500;
    return NextResponse.json(
      { error: code, message: status >= 500 ? "Bridge transfer events are temporarily unavailable" : "Bridge transfer event request is invalid" },
      { status, headers: responseHeaders(rid) },
    );
  }
}
