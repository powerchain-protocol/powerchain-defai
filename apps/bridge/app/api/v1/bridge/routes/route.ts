import { NextResponse } from "next/server";
import { publicBridgeConfiguration } from "@/server/services/bridge-config";

export const dynamic = "force-dynamic";

export function GET() {
  try {
    const config = publicBridgeConfiguration();
    return NextResponse.json({ data: { defaultDirection: config.defaultDirection, principalRule: config.principalRule, routes: config.routes } }, { headers: { "cache-control": "no-store, max-age=0" } });
  } catch {
    return NextResponse.json(
      { error: { code: "BRIDGE_ROUTES_UNAVAILABLE", message: "Bridge routes are temporarily unavailable" } },
      { status: 503, headers: { "cache-control": "no-store, max-age=0", pragma: "no-cache" } },
    );
  }
}
