import { NextRequest, NextResponse } from "next/server";
import { getSolanaPwrcSnapshot, getSuiWpwrcSnapshot } from "@/server/services/chain-data";
import { getMarketPrice } from "@/server/services/market-prices";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const solanaOwner = request.nextUrl.searchParams.get("solanaOwner")?.trim() || undefined;
  const suiOwner = request.nextUrl.searchParams.get("suiOwner")?.trim() || undefined;
  const [solana, sui, price] = await Promise.allSettled([
    getSolanaPwrcSnapshot(solanaOwner),
    getSuiWpwrcSnapshot(suiOwner),
    getMarketPrice("PWRC"),
  ]);
  const body = {
    asset: "PWRC",
    checkedAt: new Date().toISOString(),
    solana: solana.status === "fulfilled" ? { ok: true, data: solana.value } : { ok: false, error: solana.reason instanceof Error ? solana.reason.message : "unavailable" },
    sui: sui.status === "fulfilled" ? { ok: true, data: sui.value } : { ok: false, error: sui.reason instanceof Error ? sui.reason.message : "unavailable" },
    market: price.status === "fulfilled" ? { ok: true, data: price.value } : { ok: false, error: price.reason instanceof Error ? price.reason.message : "unavailable" },
    authoritativeForBridgeAccounting: false,
  };
  const hasChain = body.solana.ok || body.sui.ok;
  return NextResponse.json(body, { status: hasChain ? 200 : 503, headers: { "cache-control": "no-store, max-age=0" } });
}
