import { randomUUID } from "node:crypto";
import { prisma } from "@powerchain/database/prisma";
import type { PrismaTransactionClient } from "@powerchain/database/prisma";
import { verifySolanaToken2022ServiceFee } from "./solana";
import { verifySuiServiceFee } from "./sui";
import { ensureServiceFeeSettlementForTransfer } from "./settlement";
import { nextServiceFeeRetryAt } from "./retry";

function urls(...values: Array<string | undefined>): string[] {
  return [...new Set(values.map((v) => v?.trim()).filter((v): v is string => Boolean(v)))];
}

function evidenceCollectedBaseUnits(evidence: Record<string, unknown>, fallback: string): string | null {
  for (const key of ["collectedBaseUnits", "recipientIncreaseBaseUnits", "matchedBaseUnits"]) {
    const value = evidence[key];
    if (typeof value === "string" && /^(0|[1-9][0-9]*)$/.test(value)) return value;
    if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) return String(value);
  }
  return fallback;
}

function maxAttempts(env: NodeJS.ProcessEnv = process.env): number {
  const parsed = Number(env.POWERCHAIN_FEE_MAX_ATTEMPTS ?? 25);
  return Number.isInteger(parsed) ? Math.max(3, Math.min(100, parsed)) : 25;
}

export async function recordServiceFeeVerificationError(transferId: string, errorCode: string, env: NodeJS.ProcessEnv = process.env) {
  const now = new Date();
  return prisma.$transaction(async (tx: PrismaTransactionClient) => {
    const current = await tx.bridgeServiceFeeSettlement.findUnique({ where: { transferId } });
    if (!current || current.status === "VERIFIED" || current.status === "WAIVED" || current.status === "MANUAL_REVIEW") return current;
    const attemptCount = current.attemptCount + 1;
    const exhausted = attemptCount >= maxAttempts(env);
    const nextRetryAt = exhausted ? null : nextServiceFeeRetryAt(attemptCount, now);
    const nextStatus = exhausted ? "MANUAL_REVIEW" : "RETRY_WAIT";
    const failureCode = exhausted ? `RETRY_EXHAUSTED:${errorCode}`.slice(0, 160) : errorCode;
    const changed = current.status !== nextStatus || current.failureCode !== failureCode;
    const updated = await tx.bridgeServiceFeeSettlement.update({
      where: { transferId },
      data: exhausted
        ? { status: "MANUAL_REVIEW", attemptCount, lastAttemptAt: now, nextRetryAt: null, failureCode, manualReviewAt: now, manualReviewReason: failureCode, verificationLeaseOwner: null, verificationLeaseUntil: null }
        : { status: "RETRY_WAIT", attemptCount, lastAttemptAt: now, nextRetryAt, failureCode, verificationLeaseOwner: null, verificationLeaseUntil: null },
    });
    if (changed) await tx.bridgeAuditEvent.create({ data: {
      id: randomUUID(), event: exhausted ? "service-fee.settlement.manual-review" : "service-fee.settlement.retry-wait", actor: "service-fee-worker", target: updated.id,
      payload: { transferId, attemptCount, nextRetryAt: nextRetryAt?.toISOString() ?? null, errorCode: failureCode, exhausted },
    }});
    return updated;
  });
}

export async function verifyServiceFeeForTransfer(transferId: string, env: NodeJS.ProcessEnv = process.env) {
  const settlement = await ensureServiceFeeSettlementForTransfer(transferId);
  if (["VERIFIED", "WAIVED", "MANUAL_REVIEW"].includes(settlement.status)) return settlement;
  const transfer = await prisma.bridgeTransfer.findUnique({ where: { id: transferId } });
  if (!transfer?.sourceTx) return settlement;

  const result = settlement.sourceChain === "SOLANA"
    ? await verifySolanaToken2022ServiceFee({
        rpcUrls: urls(env.POWERCHAIN_SOLANA_RPC_URL, env.HELIUS_RPC_URL, env.POWERCHAIN_SOLANA_RPC_FALLBACK_URL, env.HELIUS_RPC_FALLBACK_URL),
        signature: transfer.sourceTx,
        mint: env.POWERCHAIN_PWRC_SOLANA_MINT?.trim() ?? "",
        recipientWallet: settlement.recipient,
        expectedBaseUnits: settlement.feeBaseUnits.toFixed(0),
        ...(env.SOLANA_RPC_TIMEOUT_MS ? { timeoutMs: Number(env.SOLANA_RPC_TIMEOUT_MS) } : {}),
      })
    : await verifySuiServiceFee({
        rpcUrls: urls(env.POWERCHAIN_SUI_GRPC_URL, env.POWERCHAIN_SUI_RPC_URL, env.POWERCHAIN_SUI_RPC_FALLBACK_URL),
        digest: transfer.sourceTx,
        coinType: env.WPWRC_SUI_COIN_TYPE?.trim() ?? env.SUI_WPWRC_COIN_TYPE?.trim() ?? "",
        recipient: settlement.recipient,
        expectedBaseUnits: settlement.feeBaseUnits.toFixed(0),
      });

  const now = new Date();
  return prisma.$transaction(async (tx: PrismaTransactionClient) => {
    const current = await tx.bridgeServiceFeeSettlement.findUnique({ where: { transferId } });
    if (!current) throw new Error("SERVICE_FEE_SETTLEMENT_NOT_FOUND");
    if (["VERIFIED", "WAIVED", "MANUAL_REVIEW"].includes(current.status)) return current;
    const attemptCount = current.attemptCount + 1;
    const expected = settlement.feeBaseUnits.toFixed(0);
    const collected = result.verified ? evidenceCollectedBaseUnits(result.evidence, expected) : evidenceCollectedBaseUnits(result.evidence, "0");
    const retryExhausted = !result.verified && !result.finalized && attemptCount >= maxAttempts(env);
    const nextStatus = result.verified ? "VERIFIED" : result.finalized || retryExhausted ? "MANUAL_REVIEW" : "RETRY_WAIT";
    const rawFailureCode = result.verified ? null : result.errorCode ?? "SERVICE_FEE_UNVERIFIED";
    const failureCode = retryExhausted && rawFailureCode ? `RETRY_EXHAUSTED:${rawFailureCode}`.slice(0, 160) : rawFailureCode;
    const nextRetryAt = nextStatus === "RETRY_WAIT" ? nextServiceFeeRetryAt(attemptCount, now) : null;
    const changed = current.status !== nextStatus || current.failureCode !== failureCode;
    const updated = await tx.bridgeServiceFeeSettlement.update({
      where: { transferId },
      data: result.verified
        ? { status: "VERIFIED", sourceTx: transfer.sourceTx, verifiedAt: now, collectedBaseUnits: expected, attemptCount, lastAttemptAt: now, nextRetryAt: null, failureCode: null, manualReviewAt: null, manualReviewReason: null, verificationEvidence: result.evidence, verificationLeaseOwner: null, verificationLeaseUntil: null }
        : result.finalized || retryExhausted
          ? { status: "MANUAL_REVIEW", sourceTx: transfer.sourceTx, collectedBaseUnits: collected, attemptCount, lastAttemptAt: now, nextRetryAt: null, failureCode, manualReviewAt: now, manualReviewReason: failureCode, verificationEvidence: result.evidence, verificationLeaseOwner: null, verificationLeaseUntil: null }
          : { status: "RETRY_WAIT", sourceTx: transfer.sourceTx, collectedBaseUnits: collected, attemptCount, lastAttemptAt: now, nextRetryAt, failureCode, verificationEvidence: result.evidence, verificationLeaseOwner: null, verificationLeaseUntil: null },
    });
    if (changed) {
      const event = result.verified ? "service-fee.settlement.verified" : result.finalized || retryExhausted ? "service-fee.settlement.manual-review" : "service-fee.settlement.retry-wait";
      await tx.bridgeAuditEvent.create({ data: {
        id: randomUUID(), event, actor: "service-fee-worker", target: updated.id,
        payload: { transferId, sourceTx: transfer.sourceTx, expectedBaseUnits: expected, collectedBaseUnits: collected, recipient: settlement.recipient, status: nextStatus, failureCode, attemptCount, nextRetryAt: nextRetryAt?.toISOString() ?? null },
      }});
    }
    return updated;
  });
}
