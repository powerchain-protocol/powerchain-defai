import { NextRequest, NextResponse } from "next/server";
import { getWalletPortfolio } from "@/server/services/wallet-portfolio";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const solanaAddress = request.nextUrl.searchParams.get("solanaAddress")?.trim() || null;
  const suiAddress = request.nextUrl.searchParams.get("suiAddress")?.trim() || null;
  if (!solanaAddress && !suiAddress) return NextResponse.json({ code: "WALLET_ADDRESS_REQUIRED", message: "solanaAddress or suiAddress is required" }, { status: 400, headers: { "Cache-Control": "no-store, max-age=0" } });
  try {
    const data = await getWalletPortfolio({ solanaAddress, suiAddress });
    return NextResponse.json(data, { status: data.status === "unavailable" ? 503 : 200, headers: { "Cache-Control": "no-store, max-age=0", "X-PowerChain-Wallet-Status": data.status } });
  } catch (error) {
    return NextResponse.json({ code: "WALLET_PORTFOLIO_UNAVAILABLE", message: error instanceof Error ? error.message : "Wallet portfolio unavailable" }, { status: 503, headers: { "Cache-Control": "no-store, max-age=0" } });
  }
}
