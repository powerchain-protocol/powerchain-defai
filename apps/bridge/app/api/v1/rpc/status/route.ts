import { NextRequest, NextResponse } from "next/server";
import { rpcRuntimeStatus } from "@powerchain/backend/services/rpc";
import { enforceCoreRoute, routeError } from "@/server/routing/api-router";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const guard = enforceCoreRoute(request); if (!guard.ok) return guard.response;
  try {
    const status = await rpcRuntimeStatus();
    return NextResponse.json({ ...status, requestId: guard.requestId }, { headers: { "cache-control": "no-store" } });
  } catch (error) { return routeError(error, 503); }
}
