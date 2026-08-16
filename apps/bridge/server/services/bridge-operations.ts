import "server-only";

import { randomUUID } from "node:crypto";
import { normalizeChainAddress, type BlockchainChain } from "@powerchain/blockchain";
import { retrySerializableTransaction, writeBridgeAuditEvent } from "@powerchain/database";
import { prisma } from "@powerchain/database/prisma";
import type { PrismaTransactionClient } from "@powerchain/database/prisma";
import { assessActiveServiceFee } from "@powerchain/backend";
import { buildBridgeIntent } from "./bridge-intent";
import { checkBridgeRuntime } from "./bridge-runtime";
import { canonicalBridgeRoute, parseBridgeDirection, type BridgeDirection } from "../../lib/bridge/route-contract";
import { parsePositiveBaseUnits } from "../../lib/bridge/base-units";

function routeId(direction: BridgeDirection) {
  return direction === "SOLANA_TO_SUI"
    ? process.env.POWERCHAIN_ROUTE_SOLANA_TO_SUI_ID?.trim() || "powerchain-solana-to-sui"
    : process.env.POWERCHAIN_ROUTE_SUI_TO_SOLANA_ID?.trim() || "powerchain-sui-to-solana";
}

function cleanAddress(chain: BlockchainChain, value: unknown) {
  if (typeof value !== "string" || !value.trim()) throw new Error("ADDRESS_REQUIRED");
  return normalizeChainAddress(chain, value);
}

export async function issueBridgeQuote(raw: unknown) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("INVALID_QUOTE_REQUEST");
  const input = raw as Record<string, unknown>;
  const direction = parseBridgeDirection(input.direction);
  const route = canonicalBridgeRoute(direction);
  const principalBaseUnits = parsePositiveBaseUnits(String(input.principalBaseUnits ?? ""), "principalBaseUnits").toString();
  const sourceAddress = cleanAddress(route.sourceChain, input.sourceAddress);
  const destinationAddress = cleanAddress(route.destinationChain, input.destinationAddress);
  const runtime = await checkBridgeRuntime();
  if (!runtime.capabilities.quote) throw new Error("BRIDGE_RUNTIME_BLOCKED");
  const id = randomUUID();
  const selectedRouteId = routeId(direction);
  const fee = await assessActiveServiceFee({ routeId: selectedRouteId, sourceChain: route.sourceChain, principalBaseUnits });
  const ttlMs = Math.max(15_000, Math.min(120_000, Number(process.env.POWERCHAIN_QUOTE_TTL_MS ?? 60_000)));
  const expiresAt = new Date(Date.now() + ttlMs);
  const intent = buildBridgeIntent({
    quoteId: id,
    direction,
    principalBaseUnits,
    serviceFeeBaseUnits: fee.feeBaseUnits,
    sourceAddress,
    destinationAddress,
    feeRecipient: fee.recipient,
    runtimeSnapshotId: runtime.snapshotId,
    quoteExpiresAt: expiresAt.toISOString(),
  });
  const quote = await prisma.bridgeQuote.create({ data: {
    id,
    routeId: selectedRouteId,
    direction,
    amountBaseUnits: principalBaseUnits,
    feeBaseUnits: fee.feeBaseUnits,
    sourceAddress,
    destinationAddress,
    serviceFeeRecipient: fee.recipient,
    runtimeSnapshotId: runtime.snapshotId,
    intentCommitment: intent.commitment,
    expiresAt,
  }});
  return {
    quoteId: quote.id,
    routeId: quote.routeId,
    direction,
    sourceChain: route.sourceChain,
    destinationChain: route.destinationChain,
    sourceAsset: route.sourceAsset,
    destinationAsset: route.destinationAsset,
    principalBaseUnits,
    serviceFeeBaseUnits: fee.feeBaseUnits,
    totalSourceDebitBaseUnits: intent.totalSourceDebitBaseUnits,
    serviceFeeRecipient: fee.recipient,
    feeBps: fee.feeBps,
    feePolicyId: fee.policyId,
    feePolicyVersion: fee.policyVersion,
    runtimeSnapshotId: runtime.snapshotId,
    intentCommitment: intent.commitment,
    expiresAt: expiresAt.toISOString(),
    principalRule: "1:1" as const,
  };
}

export async function createBridgeTransfer(input: { raw: unknown; idempotencyKey: string }) {
  if (!input.raw || typeof input.raw !== "object" || Array.isArray(input.raw)) throw new Error("INVALID_TRANSFER_REQUEST");
  const body = input.raw as Record<string, unknown>;
  const quoteId = String(body.quoteId ?? "").trim();
  const intentCommitment = String(body.intentCommitment ?? "").trim();
  const runtimeSnapshotId = String(body.runtimeSnapshotId ?? "").trim();
  const sourceTx = typeof body.sourceTx === "string" && body.sourceTx.trim() ? body.sourceTx.trim() : null;
  if (!quoteId || !intentCommitment || !runtimeSnapshotId) throw new Error("TRANSFER_BINDING_REQUIRED");

  const runtime = await checkBridgeRuntime();
  if (!runtime.capabilities["transfer-submit"]) throw new Error("BRIDGE_RUNTIME_BLOCKED");
  if (runtime.snapshotId !== runtimeSnapshotId) throw new Error("RUNTIME_SNAPSHOT_STALE");

  return retrySerializableTransaction(() => prisma.$transaction(async (tx: PrismaTransactionClient) => {
    const existingByKey = await tx.bridgeTransfer.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
    if (existingByKey) {
      if (existingByKey.quoteId !== quoteId || existingByKey.intentCommitment !== intentCommitment) throw new Error("IDEMPOTENCY_KEY_REUSED");
      return existingByKey;
    }

    const quote = await tx.bridgeQuote.findUnique({ where: { id: quoteId }, include: { transfer: true } });
    if (!quote) throw new Error("QUOTE_NOT_FOUND");
    if (quote.transfer) {
      if (quote.transfer.idempotencyKey === input.idempotencyKey && quote.transfer.intentCommitment === intentCommitment) return quote.transfer;
      throw new Error("QUOTE_ALREADY_USED");
    }
    if (quote.expiresAt.getTime() <= Date.now()) throw new Error("QUOTE_EXPIRED");
    if (quote.intentCommitment !== intentCommitment) throw new Error("INTENT_COMMITMENT_MISMATCH");
    if (quote.runtimeSnapshotId !== runtimeSnapshotId) throw new Error("RUNTIME_SNAPSHOT_MISMATCH");

    const transfer = await tx.bridgeTransfer.create({ data: {
      id: randomUUID(),
      quoteId: quote.id,
      routeId: quote.routeId,
      direction: quote.direction,
      principalBaseUnits: quote.amountBaseUnits,
      sourceAddress: quote.sourceAddress,
      destinationAddress: quote.destinationAddress,
      runtimeSnapshotId,
      intentCommitment,
      idempotencyKey: input.idempotencyKey,
      sourceTx,
      status: sourceTx ? "SOURCE_SUBMITTED" : "CREATED",
    }});
    await writeBridgeAuditEvent(tx, {
      event: sourceTx ? "bridge.source-submitted" : "bridge.created",
      actor: "bridge-api",
      target: transfer.id,
      payload: { status: transfer.status, direction: transfer.direction, sourceTx },
    });
    return transfer;
  }, { isolationLevel: "Serializable" }));
}

export async function getBridgeTransfer(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("INVALID_TRANSFER_ID");
  const transfer = await prisma.bridgeTransfer.findUnique({ where: { id }, include: { quote: true } });
  if (!transfer) throw new Error("TRANSFER_NOT_FOUND");
  return transfer;
}


export async function attachBridgeSourceTransaction(input: { transferId: string; sourceTx: string }) {
  if (!/^[0-9a-f-]{36}$/i.test(input.transferId)) throw new Error("INVALID_TRANSFER_ID");
  const sourceTx = input.sourceTx.trim();
  if (!sourceTx || sourceTx.length > 128) throw new Error("INVALID_SOURCE_TRANSACTION");
  return retrySerializableTransaction(() => prisma.$transaction(async (tx: PrismaTransactionClient) => {
    const row = await tx.bridgeTransfer.findUnique({ where: { id: input.transferId } });
    if (!row) throw new Error("TRANSFER_NOT_FOUND");
    if (row.sourceTx) {
      if (row.sourceTx === sourceTx) return row;
      throw new Error("SOURCE_TRANSACTION_ALREADY_ATTACHED");
    }
    if (row.status !== "CREATED") throw new Error("TRANSFER_NOT_AWAITING_SOURCE_TRANSACTION");
    const reused = await tx.bridgeTransfer.findUnique({ where: { sourceTx } });
    if (reused && reused.id !== row.id) throw new Error("SOURCE_TRANSACTION_REUSED");
    const updated = await tx.bridgeTransfer.update({ where: { id: row.id }, data: { sourceTx, status: "SOURCE_SUBMITTED", failureCode: null } });
    await writeBridgeAuditEvent(tx, {
      event: "bridge.source-submitted",
      actor: "bridge-api",
      target: row.id,
      payload: { status: "SOURCE_SUBMITTED", sourceTx },
    });
    return updated;
  }, { isolationLevel: "Serializable" }));
}
