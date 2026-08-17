import "server-only";

import { NextResponse } from "next/server";
import { requireBridgeRuntimeCapability, type BridgeRuntimeCapability } from "../services/bridge-runtime";

export async function enforceBridgeRuntimeRequest(capability: BridgeRuntimeCapability) {
  try {
    const decision = await requireBridgeRuntimeCapability(capability);
    if (decision.allowed) return null;
    return NextResponse.json({
      error: "BRIDGE_RUNTIME_BLOCKED",
      message: "PowerChain runtime safety checks are blocking this operation.",
      capability,
      runtimeStatus: decision.runtime.status,
      runtimeSnapshotId: decision.runtime.snapshotId,
      checkedAt: decision.runtime.checkedAt,
      validUntil: decision.runtime.validUntil,
      retryable: true,
    }, {
      status: 503,
      headers: {
        "cache-control": "no-store, max-age=0",
        "retry-after": "5",
        "x-powerchain-defai-runtime": decision.runtime.status,
        "x-powerchain-runtime-snapshot": decision.runtime.snapshotId,
      },
    });
  } catch (error) {
    return NextResponse.json({
      error: "BRIDGE_RUNTIME_UNAVAILABLE",
      message: "PowerChain runtime safety checks are unavailable.",
      capability,
      retryable: true,
      cause: error instanceof Error ? error.name : "Unavailable",
    }, {
      status: 503,
      headers: {
        "cache-control": "no-store, max-age=0",
        "retry-after": "5",
        "x-powerchain-defai-runtime": "blocked",
      },
    });
  }
}
