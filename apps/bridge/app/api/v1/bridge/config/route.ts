import { NextResponse } from "next/server";
import { publicBridgeConfiguration } from "@/server/services/bridge-config";

export const dynamic = "force-dynamic";

export function GET() {
  try {
    return NextResponse.json({ data: publicBridgeConfiguration() }, { headers: { "cache-control": "no-store, max-age=0" } });
  } catch (error) {
    return NextResponse.json(
      { error: { code: "BRIDGE_CONFIG_UNAVAILABLE", message: error instanceof Error ? error.message : "Bridge configuration unavailable" } },
      { status: 503, headers: { "cache-control": "no-store, max-age=0" } },
    );
  }
}
