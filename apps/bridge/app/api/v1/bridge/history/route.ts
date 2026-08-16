import { NextResponse } from "next/server";
import { boundedHistoryLimit, listBridgeTransactions, parseBridgeHistoryStatus } from "@powerchain/backend/services/transactions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const address = url.searchParams.get("address")?.trim() || null;
  const requestedStatus = url.searchParams.get("status");
  const status = parseBridgeHistoryStatus(requestedStatus);
  if (requestedStatus?.trim() && !status) {
    return NextResponse.json({ error: "INVALID_TRANSFER_STATUS" }, { status: 400, headers: { "cache-control": "no-store, max-age=0" } });
  }
  const page = await listBridgeTransactions({
    address,
    status,
    limit: boundedHistoryLimit(url.searchParams.get("limit")),
    cursor: url.searchParams.get("cursor"),
  });
  return NextResponse.json(page, { headers: { "cache-control": "no-store, max-age=0", "x-content-type-options": "nosniff" } });
}
