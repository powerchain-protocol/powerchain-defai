import { NextRequest, NextResponse } from "next/server";
import { calculateTransactionAmounts } from "@powerchain/backend/services/calculators";
import { assertJsonContentLength } from "@powerchain/backend/services/security";
import { enforceCoreRoute, routeError } from "@/server/routing/api-router";

export const dynamic = "force-dynamic";
type Body = { principalBaseUnits?: unknown; quotedOutputBaseUnits?: unknown; feeBps?: unknown; slippageBps?: unknown; minFeeBaseUnits?: unknown; maxFeeBaseUnits?: unknown };
function optionalBaseUnits(value: unknown): string | null | undefined { if (value == null) return value as null | undefined; if (typeof value !== "string" || !/^\d+$/.test(value)) throw new Error("OPTIONAL_BASE_UNITS_INVALID"); return value; }
export async function POST(request: NextRequest) {
  const guard = enforceCoreRoute(request); if (!guard.ok) return guard.response;
  try {
    assertJsonContentLength(request.headers.get("content-length"));
    const body = await request.json() as Body;
    if (typeof body.principalBaseUnits !== "string" || typeof body.quotedOutputBaseUnits !== "string" || typeof body.feeBps !== "number" || typeof body.slippageBps !== "number") return routeError("CALCULATOR_INPUT_INVALID", 400);
    const result = calculateTransactionAmounts({ principalBaseUnits: body.principalBaseUnits, quotedOutputBaseUnits: body.quotedOutputBaseUnits, feeBps: body.feeBps, slippageBps: body.slippageBps, minFeeBaseUnits: optionalBaseUnits(body.minFeeBaseUnits), maxFeeBaseUnits: optionalBaseUnits(body.maxFeeBaseUnits) });
    return NextResponse.json({ ...result, requestId: guard.requestId, authoritativeForBridgeAccounting: false }, { headers: { "cache-control": "no-store" } });
  } catch (error) { return routeError(error, 400); }
}
