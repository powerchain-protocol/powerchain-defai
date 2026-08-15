import { NextRequest, NextResponse } from "next/server";
import { getSolanaWalletOverview } from "@/server/services/wallet-data";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address")?.trim() || "";
  const before = request.nextUrl.searchParams.get("before")?.trim() || null;
  const rawLimit = Number(request.nextUrl.searchParams.get("limit") || 25);
  try {
    const data = await getSolanaWalletOverview(address, { before, limit: Number.isFinite(rawLimit) ? rawLimit : 25 });
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    return NextResponse.json({ code: "SOLANA_WALLET_DATA_UNAVAILABLE", message: error instanceof Error ? error.message : "Solana wallet data unavailable" }, { status: 503, headers: { "Cache-Control": "no-store, max-age=0" } });
  }
}
