import { NextRequest, NextResponse } from "next/server";
import { getSuiWpwrcSnapshot } from "@/server/services/chain-data";
import { getSuiCoinMetadata } from "@/server/services/sui-metadata";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    const owner = request.nextUrl.searchParams.get("owner")?.trim() || undefined;
    const data = await getSuiWpwrcSnapshot(owner);
    const metadata = await getSuiCoinMetadata(String(data.coinType)).catch(() => null);
    return NextResponse.json({ ...data, metadata }, { headers: { "cache-control": "no-store, max-age=0" } });
  } catch (error) {
    return NextResponse.json({ error: "CHAIN_DATA_UNAVAILABLE", message: error instanceof Error ? error.message : "Sui data unavailable" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
