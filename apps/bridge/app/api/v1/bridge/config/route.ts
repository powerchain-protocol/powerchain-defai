import { NextResponse } from "next/server";
import { publicBridgeConfiguration } from "@/server/services/bridge-config";

export const dynamic = "force-dynamic";

export function GET() {
  try {
    return NextResponse.json({ data: publicBridgeConfiguration() }, { headers: { "cache-control": "no-store, max-age=0" } });
  } catch {
    return NextResponse.json(
      { error: { code: "BRIDGE_CONFIG_UNAVAILABLE", message: "Bridge configuration is temporarily unavailable" } },
      { status: 503, headers: { "cache-control": "no-store, max-age=0", pragma: "no-cache" } },
    );
  }
}
