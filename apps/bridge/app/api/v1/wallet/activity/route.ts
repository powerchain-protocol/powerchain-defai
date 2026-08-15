import { NextRequest, NextResponse } from "next/server";
import { getWalletActivityFeed } from "@/server/services/wallet-activity-feed";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const solanaAddress = request.nextUrl.searchParams.get("solanaAddress")?.trim() || null;
  const suiAddress = request.nextUrl.searchParams.get("suiAddress")?.trim() || null;
  if (!solanaAddress && !suiAddress) return NextResponse.json({ code: "WALLET_ADDRESS_REQUIRED", message: "solanaAddress or suiAddress is required" }, { status: 400, headers: { "Cache-Control": "no-store, max-age=0" } });
  const limitRaw = Number(request.nextUrl.searchParams.get("limit") || 25);
  try {
    const data = await getWalletActivityFeed({ solanaAddress, suiAddress, cursor: request.nextUrl.searchParams.get("cursor"), limit: Number.isFinite(limitRaw) ? limitRaw : 25 });
    return NextResponse.json(data, { status: data.status === "unavailable" ? 503 : 200, headers: { "Cache-Control": "no-store, max-age=0", "X-PowerChain-Wallet-Status": data.status } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Wallet activity unavailable";
    const invalidCursor = /cursor/.test(message);
    return NextResponse.json({ code: invalidCursor ? "INVALID_CURSOR" : "WALLET_ACTIVITY_UNAVAILABLE", message }, { status: invalidCursor ? 400 : 503, headers: { "Cache-Control": "no-store, max-age=0" } });
  }
}
