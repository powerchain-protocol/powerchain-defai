import { notFound } from "next/navigation";
import { getClaim } from "@powerchain/backend/claims";
import { ClaimStatusCard } from "@/components/claim/claim-status-card";
import { PageHeader } from "@/components/ui/page-header";
import { baseUnitsToDecimalString } from "@/lib/bridge/base-units";

export const dynamic = "force-dynamic";

export default async function ClaimStatusPage({ params }: { params: Promise<{ claimId: string }> }) {
  const { claimId } = await params;
  let claim: Awaited<ReturnType<typeof getClaim>>;
  try { claim = await getClaim(claimId); }
  catch (error) { if (error instanceof Error && error.message === "CLAIM_NOT_FOUND") notFound(); throw error; }

  return <main className="mx-auto max-w-4xl space-y-5"><PageHeader eyebrow="PowerChain Claim" title="Claim status" description="Persisted reservation, worker submission, transaction evidence and payout finality for this claim."/><ClaimStatusCard claim={{ id: claim.id, wallet: claim.wallet, status: claim.status, amount: baseUnitsToDecimalString(BigInt(claim.amountBaseUnits.toFixed(0)), 9), sourceTx: claim.sourceTx, failureCode: claim.failureCode, reservationExpiresAt: claim.reservationExpiresAt.toISOString(), finalizedAt: claim.finalizedAt?.toISOString() ?? null, updatedAt: claim.updatedAt.toISOString() }}/></main>;
}
