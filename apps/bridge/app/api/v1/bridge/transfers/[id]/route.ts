import { NextResponse } from "next/server";
import { getBridgeTransfer } from "@/server/services/bridge-operations";
import { serveCanonicalOperationStatus } from "@/server/services/operation-status-service";
import { loadBridgeOperationStatus } from "@/server/services/operation-loaders";
export const dynamic = "force-dynamic";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (new URL(request.url).searchParams.get("format") === "operation") return serveCanonicalOperationStatus(request, "bridge", id, async (_kind, operationId) => loadBridgeOperationStatus(operationId));
  try {
    const row = await getBridgeTransfer(id);
    return NextResponse.json({ data: {
      id: row.id, quoteId: row.quoteId, routeId: row.routeId, direction: row.direction, status: row.status,
      principalBaseUnits: row.principalBaseUnits.toFixed(0), sourceAddress: row.sourceAddress, destinationAddress: row.destinationAddress,
      sourceTx: row.sourceTx, destinationTx: row.destinationTx, sourceFinalityRef: row.sourceFinalityRef, destinationFinalityRef: row.destinationFinalityRef,
      runtimeSnapshotId: row.runtimeSnapshotId, intentCommitment: row.intentCommitment, wormholeOperationId: row.wormholeOperationId, wormholeEmitterChain: row.wormholeEmitterChain, wormholeEmitter: row.wormholeEmitter, wormholeSequence: row.wormholeSequence, wormholeVaaHash: row.wormholeVaaHash, sourceVerifiedAt: row.sourceVerifiedAt?.toISOString() ?? null, messageObservedAt: row.messageObservedAt?.toISOString() ?? null, destinationVerifiedAt: row.destinationVerifiedAt?.toISOString() ?? null, reconciliationEvidence: row.reconciliationEvidence, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
    }}, { headers: { "cache-control": "no-store, max-age=0" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "TRANSFER_STATUS_FAILED";
    return NextResponse.json({ error: code }, { status: code.includes("NOT_FOUND") ? 404 : code.includes("INVALID") ? 400 : 500, headers: { "cache-control": "no-store, max-age=0" } });
  }
}
