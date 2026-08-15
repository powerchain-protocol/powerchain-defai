import { NextResponse } from "next/server";
import { checkBridgeRuntime } from "@/server/services/bridge-runtime";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const runtime = await checkBridgeRuntime();
    return NextResponse.json(runtime, {
      status: runtime.status === "blocked" ? 503 : 200,
      headers: {
        "cache-control": "no-store, max-age=0",
        "x-powerchain-bridge-runtime": runtime.status,
        "x-powerchain-runtime-snapshot": runtime.snapshotId,
        "x-powerchain-runtime-valid-until": runtime.validUntil,
      },
    });
  } catch (error) {
    return NextResponse.json({
      status: "blocked",
      capabilities: { quote: false, "wallet-signature": false, "transfer-submit": false, "status-tracking": true },
      canRequestQuote: false,
      canOpenWalletSignature: false,
      canSubmitTransfer: false,
      canTrackStatus: true,
      snapshotId: "unavailable",
      checkedAt: new Date().toISOString(),
      validUntil: new Date().toISOString(),
      checks: [],
      error: error instanceof Error ? error.name : "Unavailable",
      authoritativeForBridgeAccounting: false,
    }, {
      status: 503,
      headers: {
        "cache-control": "no-store, max-age=0",
        "retry-after": "5",
        "x-powerchain-bridge-runtime": "blocked",
      },
    });
  }
}
