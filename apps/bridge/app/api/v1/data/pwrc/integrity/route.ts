import { NextResponse } from "next/server";
import { checkPwrcAssetIntegrity } from "@/server/services/asset-integrity";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await checkPwrcAssetIntegrity();
    return NextResponse.json(result, {
      status: result.healthy ? 200 : 503,
      headers: {
        "cache-control": "no-store, max-age=0",
        "x-powerchain-asset-integrity": result.healthy ? "healthy" : "unhealthy",
      },
    });
  } catch (error) {
    return NextResponse.json({
      asset: "PWRC",
      healthy: false,
      error: error instanceof Error ? error.message : "asset integrity unavailable",
      checkedAt: new Date().toISOString(),
      authoritativeForBridgeAccounting: false,
    }, {
      status: 503,
      headers: { "cache-control": "no-store, max-age=0", "x-powerchain-asset-integrity": "unavailable" },
    });
  }
}
