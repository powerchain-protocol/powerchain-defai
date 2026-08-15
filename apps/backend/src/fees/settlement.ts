import { randomUUID } from "node:crypto";
import { prisma } from "@powerchain/database/prisma";
import type { PrismaTransactionClient } from "@powerchain/database/prisma";
import { matchServiceFeePolicyForQuote } from "./policy";
import type { ServiceFeeChain } from "./types";

function decimalText(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "bigint") return String(value);
  if (typeof value === "object" && value && "toFixed" in value && typeof (value as { toFixed?: unknown }).toFixed === "function") {
    return (value as { toFixed: (digits?: number) => string }).toFixed(0);
  }
  return String(value ?? "0");
}

function sourceChainForDirection(direction: string): ServiceFeeChain {
  if (direction === "SOLANA_TO_SUI") return "SOLANA";
  if (direction === "SUI_TO_SOLANA") return "SUI";
  throw new Error("SERVICE_FEE_DIRECTION_UNSUPPORTED");
}

export async function ensureServiceFeeSettlementForTransfer(transferId: string) {
  const existing = await prisma.bridgeServiceFeeSettlement.findUnique({ where: { transferId } });
  if (existing) return existing;

  const transfer = await prisma.bridgeTransfer.findUnique({ where: { id: transferId } });
  if (!transfer) throw new Error("TRANSFER_NOT_FOUND");
  const quote = await prisma.bridgeQuote.findUnique({ where: { id: transfer.quoteId } });
  if (!quote) throw new Error("QUOTE_NOT_FOUND");

  const sourceChain = sourceChainForDirection(String(transfer.direction));
  const principalBaseUnits = decimalText(quote.amountBaseUnits);
  const quotedFee = decimalText(quote.feeBaseUnits);
  const quotedRecipient = (quote as { serviceFeeRecipient?: string | null }).serviceFeeRecipient;
  if (!quotedRecipient) throw new Error("SERVICE_FEE_QUOTE_RECIPIENT_MISMATCH");

  // Match against the policy that was effective when the quote was issued, not today's policy.
  const expected = await matchServiceFeePolicyForQuote({
    routeId: transfer.routeId,
    sourceChain,
    principalBaseUnits,
    quotedFeeBaseUnits: quotedFee,
    quotedRecipient,
    quotedAt: quote.createdAt,
  });

  try {
    return await prisma.$transaction(async (tx: PrismaTransactionClient) => {
      const settlement = await tx.bridgeServiceFeeSettlement.create({
        data: {
          id: randomUUID(),
          transferId: transfer.id,
          quoteId: quote.id,
          routeId: transfer.routeId,
          sourceChain,
          assetId: expected.assetId,
          principalBaseUnits,
          feeBps: expected.feeBps,
          feeBaseUnits: expected.feeBaseUnits,
          recipient: expected.recipient,
          policyId: expected.policyId,
          policyVersion: expected.policyVersion,
          commitment: expected.commitment,
          sourceTx: transfer.sourceTx ?? null,
          status: expected.feeBaseUnits === "0" ? "VERIFIED" : transfer.sourceTx ? "SUBMITTED" : "ASSESSED",
          verifiedAt: expected.feeBaseUnits === "0" ? new Date() : null,
          ...(expected.feeBaseUnits === "0" ? { verificationEvidence: { zeroFee: true, policyCommitment: expected.commitment } } : {}),
        },
      });
      await tx.bridgeAuditEvent.create({ data: {
        id: randomUUID(),
        event: "service-fee.settlement.assessed",
        actor: "service-fee-system",
        target: settlement.id,
        payload: {
          transferId: transfer.id,
          quoteId: quote.id,
          sourceChain,
          principalBaseUnits,
          feeBaseUnits: expected.feeBaseUnits,
          recipient: expected.recipient,
          policyId: expected.policyId,
          policyVersion: expected.policyVersion,
          commitment: expected.commitment,
        },
      }});
      return settlement;
    }, { isolationLevel: "Serializable" });
  } catch (error) {
    const raced = await prisma.bridgeServiceFeeSettlement.findUnique({ where: { transferId } });
    if (raced) return raced;
    throw error;
  }
}

export async function assertServiceFeeVerified(transferId: string) {
  if (process.env.POWERCHAIN_SERVICE_FEE_REQUIRE_VERIFICATION === "false" && process.env.NODE_ENV !== "production") {
    return ensureServiceFeeSettlementForTransfer(transferId);
  }
  const settlement = await ensureServiceFeeSettlementForTransfer(transferId);
  if (settlement.status !== "VERIFIED" && settlement.status !== "WAIVED") throw new Error("SERVICE_FEE_NOT_VERIFIED");
  return settlement;
}
