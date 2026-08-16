import { NextResponse } from "next/server";
import { getClaim } from "@powerchain/backend";
import { serveCanonicalOperationStatus } from "@/server/services/operation-status-service";
import { loadClaimOperationStatus } from "@/server/services/operation-loaders";
export const dynamic = "force-dynamic";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (new URL(request.url).searchParams.get("format") === "operation") return serveCanonicalOperationStatus(request, "claim", id, async (_kind, operationId) => loadClaimOperationStatus(operationId));
  try {
    const claim = await getClaim(id);
    return NextResponse.json({ data: { id: claim.id, wallet: claim.wallet, status: claim.status, amountBaseUnits: claim.amountBaseUnits.toFixed(0), sourceTx: claim.sourceTx, reservationExpiresAt: claim.reservationExpiresAt.toISOString(), finalizedAt: claim.finalizedAt?.toISOString() ?? null, updatedAt: claim.updatedAt.toISOString() } }, { headers: { "cache-control": "no-store, max-age=0" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "CLAIM_STATUS_FAILED";
    return NextResponse.json({ error: code }, { status: code.includes("NOT_FOUND") ? 404 : code.includes("INVALID") ? 400 : 500, headers: { "cache-control": "no-store, max-age=0" } });
  }
}
