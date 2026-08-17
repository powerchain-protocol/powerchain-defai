import { NextRequest, NextResponse } from "next/server";
import { getSuiPythSignedUpdates } from "@powerchain/backend/services/pyth-sui";
import { enforceCoreRoute, routeError } from "@/server/routing/api-router";

export const dynamic = "force-dynamic";

type PythSuiUpdateRequest = Readonly<{ feedIds?: unknown }>;

export async function POST(request: NextRequest) {
  const guard = enforceCoreRoute(request);
  if (!guard.ok) return guard.response;

  try {
    const body = (await request.json()) as PythSuiUpdateRequest;
    if (!Array.isArray(body.feedIds) || body.feedIds.length < 1 || body.feedIds.length > 16) {
      return routeError("PYTH_SUI_FEED_IDS_INVALID", 400);
    }
    const feedIds = body.feedIds.filter((value): value is string => typeof value === "string");
    if (feedIds.length !== body.feedIds.length) return routeError("PYTH_SUI_FEED_IDS_INVALID", 400);

    const signedUpdateData = await getSuiPythSignedUpdates(feedIds);
    return NextResponse.json({
      provider: "pyth",
      chain: "SUI",
      transport: "hermes-rest-v2",
      encoding: "base64",
      feedCount: feedIds.length,
      signedUpdateData,
      authoritativeForBridgeFinality: false,
      requestId: guard.requestId,
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return routeError(error, 503);
  }
}
