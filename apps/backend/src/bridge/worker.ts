import { prisma } from "@powerchain/database/prisma";
import type { PrismaBridgeTransferUpdateInput, PrismaTransactionClient } from "@powerchain/database/prisma";
import { writeBridgeAuditEvent } from "@powerchain/database";
import { assertServiceFeeVerified } from "../fees/settlement";
import { verifyBridgeChainTransaction } from "./rpc";
import { findNttOperationForTransfer, vaaHash } from "./wormholescan";
import { bridgeMaxAttempts, bridgeRetryDisposition } from "../workers/retry-policy";

const activeStatuses = [
  "SOURCE_SUBMITTED",
  "SOURCE_FINALIZED",
  "MESSAGE_OBSERVED",
  "DESTINATION_SUBMITTED",
  "DESTINATION_FINALIZED",

] as const;

type BridgeTransitionStatus = typeof activeStatuses[number] | "RECONCILIATION_REQUIRED" | "COMPLETED";

async function transitionBridgeTransfer(
  id: string,
  status: BridgeTransitionStatus,
  data: PrismaBridgeTransferUpdateInput,
  payload: Record<string, string | number | boolean | null> = {},
) {
  return prisma.$transaction(async (tx: PrismaTransactionClient) => {
    const updated = await tx.bridgeTransfer.update({ where: { id }, data: { ...data, status } });
    await writeBridgeAuditEvent(tx, {
      event: `bridge.${status.toLowerCase().replaceAll("_", "-")}`,
      actor: "bridge-worker",
      target: id,
      payload: { status, ...payload },
    });
    return updated;
  });
}

export async function claimBridgeTransferBatch(input: { workerId: string; limit: number; leaseMs: number }) {
  const now = new Date();
  const candidates = await prisma.bridgeTransfer.findMany({
    where: {
      status: { in: [...activeStatuses] },
      AND: [
        { OR: [{ bridgeNextRetryAt: null }, { bridgeNextRetryAt: { lte: now } }] },
        { OR: [{ bridgeWorkerLeaseUntil: null }, { bridgeWorkerLeaseUntil: { lt: now } }] },
      ],
    },
    orderBy: { updatedAt: "asc" },
    take: Math.max(1, Math.min(100, input.limit)),
  });

  const claimed = [];
  for (const row of candidates) {
    const result = await prisma.bridgeTransfer.updateMany({
      where: { id: row.id, OR: [{ bridgeWorkerLeaseUntil: null }, { bridgeWorkerLeaseUntil: { lt: now } }] },
      data: { bridgeWorkerLeaseOwner: input.workerId, bridgeWorkerLeaseUntil: new Date(Date.now() + input.leaseMs) },
    });
    if (result.count === 1) claimed.push(row);
  }
  return claimed;
}

export async function renewBridgeTransferLease(id: string, workerId: string, leaseMs: number): Promise<boolean> {
  const result = await prisma.bridgeTransfer.updateMany({
    where: { id, bridgeWorkerLeaseOwner: workerId },
    data: { bridgeWorkerLeaseUntil: new Date(Date.now() + Math.max(20_000, Math.min(300_000, leaseMs))) },
  });
  return result.count === 1;
}

export async function releaseBridgeTransferLease(id: string, workerId: string) {
  await prisma.bridgeTransfer.updateMany({
    where: { id, bridgeWorkerLeaseOwner: workerId },
    data: { bridgeWorkerLeaseOwner: null, bridgeWorkerLeaseUntil: null },
  });
}

function retryDelay(attempt: number) {
  return Math.min(300_000, 5_000 * 2 ** Math.min(6, attempt));
}

export async function recordBridgeTransferRetry(id: string, workerId: string, error: string, env: NodeJS.ProcessEnv = process.env) {
  await prisma.$transaction(async (tx: PrismaTransactionClient) => {
    const row = await tx.bridgeTransfer.findUnique({ where: { id }, select: { bridgeAttemptCount: true, status: true } });
    if (!row) return;
    const attempt = row.bridgeAttemptCount + 1;
    const disposition = bridgeRetryDisposition(error);
    const exhausted = attempt >= bridgeMaxAttempts(env);
    const manualReview = disposition === "manual-review" || exhausted;
    const failureCode = `${manualReview ? exhausted ? "RETRY_EXHAUSTED" : "MANUAL_REVIEW" : "RETRY"}:${error}`.slice(0, 160);
    const result = await tx.bridgeTransfer.updateMany({
      where: { id, bridgeWorkerLeaseOwner: workerId },
      data: manualReview
        ? {
            status: "RECONCILIATION_REQUIRED",
            bridgeAttemptCount: attempt,
            bridgeNextRetryAt: null,
            bridgeWorkerLeaseOwner: null,
            bridgeWorkerLeaseUntil: null,
            failureCode,
          }
        : {
            bridgeAttemptCount: attempt,
            bridgeNextRetryAt: new Date(Date.now() + retryDelay(attempt)),
            bridgeWorkerLeaseOwner: null,
            bridgeWorkerLeaseUntil: null,
            failureCode,
          },
    });
    if (result.count === 1) {
      await writeBridgeAuditEvent(tx, {
        event: manualReview ? "bridge.manual-review" : "bridge.retry-scheduled",
        actor: workerId,
        target: id,
        payload: { attempt, error: error.slice(0, 160), disposition, exhausted, previousStatus: row.status },
      });
    }
  });
}

export async function processBridgeTransfer(id: string) {
  const row = await prisma.bridgeTransfer.findUnique({ where: { id }, include: { quote: true } });
  if (!row) throw new Error("TRANSFER_NOT_FOUND");
  const principal = row.principalBaseUnits.toFixed(0);

  if (row.status === "SOURCE_SUBMITTED") {
    if (!row.sourceTx) throw new Error("SOURCE_TX_REQUIRED");
    const evidence = await verifyBridgeChainTransaction({
      direction: row.direction,
      role: "source",
      txHash: row.sourceTx,
      wallet: row.sourceAddress,
      principalBaseUnits: principal,
    });
    await transitionBridgeTransfer(id, "SOURCE_FINALIZED", {
      sourceVerifiedAt: new Date(),
      sourceFinalityRef: JSON.stringify(evidence.evidence),
      failureCode: null,
      bridgeNextRetryAt: null,
    }, { sourceTx: row.sourceTx });
    return;
  }

  if (row.status === "SOURCE_FINALIZED" || row.status === "MESSAGE_OBSERVED") {
    if (!row.sourceTx) throw new Error("SOURCE_TX_REQUIRED");
    const operation = await findNttOperationForTransfer({
      direction: row.direction,
      sourceTx: row.sourceTx,
      principalBaseUnits: principal,
      sourceAddress: row.sourceAddress,
      destinationAddress: row.destinationAddress,
    });
    if (!operation) throw new Error("WORMHOLE_NTT_OPERATION_PENDING");

    const data: PrismaBridgeTransferUpdateInput = {
      wormholeOperationId: operation.operationId,
      wormholeEmitterChain: operation.emitterChain,
      wormholeEmitter: operation.emitterAddress,
      wormholeSequence: operation.sequence,
      wormholeVaaHash: vaaHash(operation.vaaRaw),
      messageObservedAt: new Date(),
      failureCode: null,
      bridgeNextRetryAt: null,
      ...(operation.destinationTx ? { destinationTx: operation.destinationTx } : {}),
    };
    await transitionBridgeTransfer(
      id,
      operation.destinationTx ? "DESTINATION_SUBMITTED" : "MESSAGE_OBSERVED",
      data,
      { operationId: operation.operationId, destinationTx: operation.destinationTx },
    );
    return;
  }

  if (row.status === "DESTINATION_SUBMITTED") {
    if (!row.destinationTx) throw new Error("DESTINATION_TX_REQUIRED");
    const evidence = await verifyBridgeChainTransaction({
      direction: row.direction,
      role: "destination",
      txHash: row.destinationTx,
      wallet: row.destinationAddress,
      principalBaseUnits: principal,
    });
    await transitionBridgeTransfer(id, "DESTINATION_FINALIZED", {
      destinationVerifiedAt: new Date(),
      destinationFinalityRef: JSON.stringify(evidence.evidence),
      failureCode: null,
      bridgeNextRetryAt: null,
    }, { destinationTx: row.destinationTx });
    return;
  }

  if (row.status === "DESTINATION_FINALIZED" || row.status === "RECONCILIATION_REQUIRED") {
    if (!row.sourceVerifiedAt || !row.destinationVerifiedAt || !row.wormholeOperationId || !row.sourceTx || !row.destinationTx) {
      await transitionBridgeTransfer(id, "RECONCILIATION_REQUIRED", {
        failureCode: "FINALITY_EVIDENCE_INCOMPLETE",
      }, { reason: "FINALITY_EVIDENCE_INCOMPLETE" });
      return;
    }

    try {
      await assertServiceFeeVerified(id);
    } catch (error) {
      if (error instanceof Error && error.message === "SERVICE_FEE_NOT_VERIFIED") throw new Error("SERVICE_FEE_VERIFICATION_PENDING");
      throw error;
    }

    const operation = await findNttOperationForTransfer({
      direction: row.direction,
      sourceTx: row.sourceTx,
      principalBaseUnits: principal,
      sourceAddress: row.sourceAddress,
      destinationAddress: row.destinationAddress,
    });
    if (!operation || operation.operationId !== row.wormholeOperationId || operation.destinationTx !== row.destinationTx) {
      await transitionBridgeTransfer(id, "RECONCILIATION_REQUIRED", {
        failureCode: "WORMHOLE_RECONCILIATION_MISMATCH",
      }, { reason: "WORMHOLE_RECONCILIATION_MISMATCH" });
      return;
    }

    const reconciledAt = new Date().toISOString();
    await transitionBridgeTransfer(id, "COMPLETED", {
      reconciliationEvidence: {
        kind: "POWERCHAIN_NTT_TRANSFER_RECONCILIATION",
        operationId: operation.operationId,
        sourceTx: row.sourceTx,
        destinationTx: row.destinationTx,
        principalBaseUnits: principal,
        fromChain: operation.fromChain,
        toChain: operation.toChain,
        vaaHash: vaaHash(operation.vaaRaw),
        sourceVerifiedAt: row.sourceVerifiedAt.toISOString(),
        destinationVerifiedAt: row.destinationVerifiedAt.toISOString(),
        reconciledAt,
      },
      failureCode: null,
      bridgeNextRetryAt: null,
    }, { operationId: operation.operationId, reconciledAt });
  }
}
