import { NextResponse } from "next/server";
import { getBridgedAssetRegistry } from "@/server/services/bridged-assets";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getBridgedAssetRegistry();
    return NextResponse.json(data, {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "BRIDGE_ASSET_REGISTRY_UNAVAILABLE", message: "Bridge asset registry is temporarily unavailable" } },
      { status: 503, headers: { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" } },
    );
  }
}
