import { NextRequest, NextResponse } from "next/server";
import { getPrices, type PriceAsset } from "@powerchain/backend/services/prices";
import { enforceCoreRoute, routeError } from "@/server/routing/api-router";

const SUPPORTED = new Set<PriceAsset>(["SOL", "SUI", "PWRC", "USDC", "EURC"]);
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const guard = enforceCoreRoute(request); if (!guard.ok) return guard.response;
  try {
    const raw = request.nextUrl.searchParams.get("assets") || "SOL,SUI,PWRC,USDC,EURC";
    const assets = raw.split(",").map((value) => value.trim().toUpperCase()).filter((value): value is PriceAsset => SUPPORTED.has(value as PriceAsset)).slice(0, 5);
    if (!assets.length) return routeError("INVALID_ASSETS", 400);
    const prices = await getPrices(assets); const available = prices.some((entry) => entry.ok);
    return NextResponse.json({ quote: "USD", prices, checkedAt: new Date().toISOString(), requestId: guard.requestId, authoritativeForBridgeAccounting: false }, { status: available ? 200 : 503, headers: { "cache-control": "public, max-age=0, s-maxage=5, stale-while-revalidate=15" } });
  } catch (error) { return routeError(error, 503); }
}
