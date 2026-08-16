import { NextRequest, NextResponse } from "next/server";
import { getRate, type RateAsset } from "@powerchain/backend/services/rates";
import { enforceCoreRoute, routeError } from "@/server/routing/api-router";

const SUPPORTED = new Set<RateAsset>(["USD", "SOL", "SUI", "PWRC", "USDC", "EURC"]);
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const guard = enforceCoreRoute(request); if (!guard.ok) return guard.response;
  try {
    const base = request.nextUrl.searchParams.get("base")?.trim().toUpperCase() as RateAsset | undefined;
    const quote = request.nextUrl.searchParams.get("quote")?.trim().toUpperCase() as RateAsset | undefined;
    if (!base || !quote || !SUPPORTED.has(base) || !SUPPORTED.has(quote)) return routeError("INVALID_RATE_PAIR", 400);
    const rate = await getRate(base, quote);
    return NextResponse.json({ ...rate, requestId: guard.requestId }, { headers: { "cache-control": "public, max-age=0, s-maxage=5, stale-while-revalidate=15" } });
  } catch (error) { return routeError(error, 503); }
}
