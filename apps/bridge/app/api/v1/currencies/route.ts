import { NextRequest, NextResponse } from "next/server";
import { CURRENCIES } from "@powerchain/backend/services/currencies";
import { enforceCoreRoute } from "@/server/routing/api-router";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const guard = enforceCoreRoute(request); if (!guard.ok) return guard.response;
  return NextResponse.json({ currencies: Object.values(CURRENCIES), checkedAt: new Date().toISOString(), requestId: guard.requestId, authoritativeForBridgeAccounting: false }, { headers: { "cache-control": "public, max-age=300, stale-while-revalidate=600" } });
}
