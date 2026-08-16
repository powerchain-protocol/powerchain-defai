import { NextRequest, NextResponse } from "next/server";
import { publicClusterRegistry } from "@powerchain/backend/services/blockchains";
import { enforceCoreRoute } from "@/server/routing/api-router";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const guard = enforceCoreRoute(request); if (!guard.ok) return guard.response;
  return NextResponse.json({ ...publicClusterRegistry(), checkedAt: new Date().toISOString(), requestId: guard.requestId }, { headers: { "cache-control": "public, max-age=300, stale-while-revalidate=600" } });
}
