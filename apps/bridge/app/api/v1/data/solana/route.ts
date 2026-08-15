import { NextRequest, NextResponse } from "next/server";
import { getSolanaPwrcSnapshot } from "@/server/services/chain-data";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    const owner = request.nextUrl.searchParams.get("owner")?.trim() || undefined;
    const data = await getSolanaPwrcSnapshot(owner);
    return NextResponse.json(data, { headers: { "cache-control": "no-store, max-age=0" } });
  } catch (error) {
    return NextResponse.json({ error: "CHAIN_DATA_UNAVAILABLE", message: error instanceof Error ? error.message : "Solana data unavailable" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
