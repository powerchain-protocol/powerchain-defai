import { NextRequest, NextResponse } from "next/server";
import { getCrossChainWalletOverview } from "@/server/services/wallet-overview";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const solanaAddress = request.nextUrl.searchParams.get("solanaAddress")?.trim() || null;
  const suiAddress = request.nextUrl.searchParams.get("suiAddress")?.trim() || null;
  if (!solanaAddress && !suiAddress) {
    return NextResponse.json(
      { code: "WALLET_ADDRESS_REQUIRED", message: "solanaAddress or suiAddress is required" },
      { status: 400, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
  const limitRaw = Number(request.nextUrl.searchParams.get("limit") || 25);
  try {
    const data = await getCrossChainWalletOverview({
      solanaAddress,
      suiAddress,
      solanaBefore: request.nextUrl.searchParams.get("solanaBefore"),
      solanaPaginationToken: request.nextUrl.searchParams.get("solanaPaginationToken"),
      suiCursor: request.nextUrl.searchParams.get("suiCursor"),
      limit: Number.isFinite(limitRaw) ? limitRaw : 25,
    });
    const status = data.status === "unavailable" ? 503 : 200;
    return NextResponse.json(data, {
      status,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-PowerChain-Wallet-Status": data.status,
      },
    });
  } catch {
    return NextResponse.json(
      { code: "WALLET_OVERVIEW_UNAVAILABLE", message: "Wallet overview is temporarily unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" } },
    );
  }
}
