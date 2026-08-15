import { prisma } from "@powerchain/database/prisma";

export async function claimClaimPayoutBatch(input: { workerId: string; limit: number; leaseMs: number }) {
  const now = new Date();
  const candidates = await prisma.claim.findMany({
    where: {
      status: { in: ["SUBMITTING", "SUBMITTED"] },
      AND: [
        { OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }] },
        { OR: [{ workerLeaseUntil: null }, { workerLeaseUntil: { lt: now } }] },
      ],
    },
    orderBy: { updatedAt: "asc" }, take: Math.max(1, Math.min(100, input.limit)),
    select: { id: true, status: true },
  });
  const claimed: Array<{ id: string; status: string }> = [];
  for (const row of candidates) {
    const leaseUntil = new Date(Date.now() + input.leaseMs);
    const locked = await prisma.claim.updateMany({
      where: { id: row.id, OR: [{ workerLeaseUntil: null }, { workerLeaseUntil: { lt: now } }] },
      data: { workerLeaseOwner: input.workerId, workerLeaseUntil: leaseUntil },
    });
    if (locked.count === 1) claimed.push(row);
  }
  return claimed;
}

export async function releaseClaimLease(id: string, workerId: string) {
  await prisma.claim.updateMany({ where: { id, workerLeaseOwner: workerId }, data: { workerLeaseOwner: null, workerLeaseUntil: null } });
}

export async function recordClaimRetry(id: string, workerId: string, error: string) {
  const claim = await prisma.claim.findUnique({ where: { id } });
  if (!claim || claim.workerLeaseOwner !== workerId) return;
  const attempts = claim.attemptCount + 1;
  const terminal = attempts >= 25;
  await prisma.claim.update({ where: { id }, data: {
    attemptCount: attempts,
    status: terminal ? "UNKNOWN" : claim.status,
    failureCode: error.slice(0,160),
    nextRetryAt: terminal ? null : new Date(Date.now() + Math.min(300_000, 5_000 * 2 ** Math.min(attempts, 6))),
    workerLeaseOwner: null,
    workerLeaseUntil: null,
  }});
}
