import { prisma } from "@powerchain/database/prisma";

export interface ServiceFeeLeaseClaim {
  transferId: string;
  settlementId: string;
  leaseOwner: string;
  leaseUntil: Date;
}

/**
 * Claim due service-fee settlements with PostgreSQL row locking so multiple
 * worker replicas do not duplicate RPC verification work.
 */
export async function claimServiceFeeVerificationBatch(input: {
  workerId: string;
  limit: number;
  leaseMs?: number;
}): Promise<ServiceFeeLeaseClaim[]> {
  const limit = Math.max(1, Math.min(250, Math.trunc(input.limit)));
  const leaseMs = Math.max(10_000, Math.min(300_000, Math.trunc(input.leaseMs ?? 60_000)));
  const leaseUntil = new Date(Date.now() + leaseMs);

  return prisma.$transaction(async (tx: any) => {
    const rows = await tx.$queryRawUnsafe<Array<{ id: string; transfer_id: string }>>(
      `SELECT id, transfer_id
         FROM bridge_service_fee_settlements
        WHERE status IN ('ASSESSED','SUBMITTED','RETRY_WAIT')
          AND (next_retry_at IS NULL OR next_retry_at <= NOW())
          AND (verification_lease_until IS NULL OR verification_lease_until <= NOW())
        ORDER BY COALESCE(next_retry_at, created_at), created_at, id
        FOR UPDATE SKIP LOCKED
        LIMIT $1`,
      limit,
    );
    if (rows.length === 0) return [];
    const ids = rows.map((row) => row.id);
    await tx.bridgeServiceFeeSettlement.updateMany({
      where: { id: { in: ids } },
      data: {
        verificationLeaseOwner: input.workerId,
        verificationLeaseUntil: leaseUntil,
      },
    });
    return rows.map((row) => ({ settlementId: row.id, transferId: row.transfer_id, leaseOwner: input.workerId, leaseUntil }));
  }, { isolationLevel: "ReadCommitted" });
}

export async function releaseServiceFeeVerificationLease(input: { transferId: string; workerId: string }) {
  await prisma.bridgeServiceFeeSettlement.updateMany({
    where: { transferId: input.transferId, verificationLeaseOwner: input.workerId },
    data: { verificationLeaseOwner: null, verificationLeaseUntil: null },
  });
}
