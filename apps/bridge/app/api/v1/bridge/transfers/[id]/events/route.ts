import { NextResponse } from "next/server";
import { loadBridgeEventSnapshot } from "@/server/services/bridge-events";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");
  const legacyAfter = url.searchParams.get("after");
  const parsedAfter = legacyAfter && Number.isFinite(Date.parse(legacyAfter)) ? new Date(legacyAfter) : null;
  const rawLimit = Number.parseInt(url.searchParams.get("limit") ?? "50", 10);
  const limit = Number.isFinite(rawLimit) ? rawLimit : 50;

  try {
    const snapshot = await loadBridgeEventSnapshot(id, { cursor, after: parsedAfter, limit });
    return NextResponse.json({ data: snapshot }, { headers: { "cache-control": "no-store, max-age=0" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "TRANSFER_EVENTS_FAILED";
    return NextResponse.json(
      { error: code },
      { status: code.includes("NOT_FOUND") ? 404 : code.includes("INVALID") ? 400 : 500, headers: { "cache-control": "no-store, max-age=0" } },
    );
  }
}
