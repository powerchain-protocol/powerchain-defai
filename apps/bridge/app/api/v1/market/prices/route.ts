import { NextRequest, NextResponse } from "next/server";
import { getMarketPrices, type MarketAsset } from "@/server/services/market-prices";

const SUPPORTED = new Set<MarketAsset>(["SOL", "SUI", "PWRC"]);
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("assets") || "SOL,SUI,PWRC";
  const assets = raw.split(",").map((value) => value.trim().toUpperCase()).filter((value): value is MarketAsset => SUPPORTED.has(value as MarketAsset)).slice(0, 3);
  if (!assets.length) return NextResponse.json({ error: "INVALID_ASSETS" }, { status: 400, headers: { "cache-control": "no-store" } });
  const prices = await getMarketPrices(assets);
  const available = prices.some((entry) => entry.ok);
  return NextResponse.json({ quote: "USD", prices, checkedAt: new Date().toISOString(), authoritativeForBridgeAccounting: false }, { status: available ? 200 : 503, headers: { "cache-control": "public, max-age=0, s-maxage=5, stale-while-revalidate=15" } });
}
