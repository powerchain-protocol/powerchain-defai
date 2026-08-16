import { NextResponse } from "next/server";
import { cetusIntegrationStatus } from "@powerchain/backend";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ ...cetusIntegrationStatus(), role: "optional-sui-liquidity", authoritativeForBridgeSettlement: false }, { headers: { "cache-control": "no-store" } });
}
