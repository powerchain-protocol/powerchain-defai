import { prisma } from "@powerchain/database/prisma";
import { serviceFeeCommitment } from "./commitment";

type ServiceFeeSettlementRow = {
  id: string; transferId: string; policyId: string; quoteId: string; policyVersion: number; recipient: string; routeId: string; sourceChain: "SOLANA" | "SUI"; assetId: string; principalBaseUnits: unknown; feeBps: number; feeBaseUnits: unknown; collectedBaseUnits: unknown | null; commitment: string; status: string; verifiedAt: Date | null; sourceTx: string | null; nextRetryAt: Date | null; manualReviewAt: Date | null;
};
type ServiceFeePolicyRow = { id: string; version: number; recipient: string };
type BridgeQuoteRow = { id: string; feeBaseUnits: unknown; serviceFeeRecipient?: string | null; routeId: string };

function dec(value: unknown): string {
  if (typeof value === "string" || typeof value === "number" || typeof value === "bigint") return String(value);
  if (value && typeof value === "object" && "toFixed" in value && typeof (value as { toFixed?: unknown }).toFixed === "function") {
    return (value as { toFixed: (digits?: number) => string }).toFixed(0);
  }
  return "0";
}

export interface ServiceFeeIntegrityIssue {
  settlementId: string;
  transferId: string;
  code: string;
  detail?: string;
}

export async function serviceFeeIntegrityReport(input: { since: Date; limit?: number }) {
  const limit = Math.max(1, Math.min(5000, input.limit ?? 2500));
  const settlements = await prisma.bridgeServiceFeeSettlement.findMany({
    where: { createdAt: { gte: input.since } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
  }) as ServiceFeeSettlementRow[];
  const policyIds = [...new Set(settlements.map((row) => row.policyId))];
  const quoteIds = [...new Set(settlements.map((row) => row.quoteId))];
  const [policies, quotes] = await Promise.all([
    prisma.bridgeServiceFeePolicy.findMany({ where: { id: { in: policyIds } } }) as Promise<ServiceFeePolicyRow[]>,
    prisma.bridgeQuote.findMany({ where: { id: { in: quoteIds } } }) as Promise<BridgeQuoteRow[]>,
  ]);
  const policyById = new Map(policies.map((row) => [row.id, row]));
  const quoteById = new Map(quotes.map((row) => [row.id, row]));
  const issues: ServiceFeeIntegrityIssue[] = [];
  const push = (row: { id: string; transferId: string }, code: string, detail?: string) => {
    if (issues.length < 200) issues.push({ settlementId: row.id, transferId: row.transferId, code, ...(detail ? { detail } : {}) });
  };

  for (const row of settlements) {
    const fee = dec(row.feeBaseUnits);
    const collected = row.collectedBaseUnits == null ? null : dec(row.collectedBaseUnits);
    const policy = policyById.get(row.policyId);
    const quote = quoteById.get(row.quoteId);
    if (!policy) push(row, "POLICY_MISSING");
    else {
      if (policy.version !== row.policyVersion) push(row, "POLICY_VERSION_MISMATCH");
      if (policy.recipient !== row.recipient) push(row, "POLICY_RECIPIENT_MISMATCH");
      const expectedCommitment = serviceFeeCommitment({
        policyId: row.policyId,
        policyVersion: row.policyVersion,
        routeId: row.routeId,
        sourceChain: row.sourceChain,
        assetId: row.assetId,
        principalBaseUnits: dec(row.principalBaseUnits),
        feeBps: row.feeBps,
        feeBaseUnits: fee,
        recipient: row.recipient,
      });
      if (expectedCommitment !== row.commitment) push(row, "SETTLEMENT_COMMITMENT_MISMATCH");
    }
    if (!quote) push(row, "QUOTE_MISSING");
    else {
      if (dec(quote.feeBaseUnits) !== fee) push(row, "QUOTE_FEE_MISMATCH");
      if (quote.serviceFeeRecipient !== row.recipient) push(row, "QUOTE_RECIPIENT_MISMATCH");
      if (quote.routeId !== row.routeId) push(row, "QUOTE_ROUTE_MISMATCH");
    }
    if (row.status === "VERIFIED") {
      if (!row.verifiedAt) push(row, "VERIFIED_WITHOUT_TIMESTAMP");
      if (BigInt(fee) > 0n && !row.sourceTx) push(row, "VERIFIED_WITHOUT_SOURCE_TX");
      if (collected !== fee) push(row, "VERIFIED_AMOUNT_MISMATCH", `expected=${fee};collected=${collected ?? "null"}`);
    }
    if (row.status === "SUBMITTED" && !row.sourceTx) push(row, "SUBMITTED_WITHOUT_SOURCE_TX");
    if (row.status === "RETRY_WAIT" && !row.nextRetryAt) push(row, "RETRY_WITHOUT_SCHEDULE");
    if (row.status === "MANUAL_REVIEW" && !row.manualReviewAt) push(row, "MANUAL_REVIEW_WITHOUT_TIMESTAMP");
  }

  const counts = settlements.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1;
    return acc;
  }, {});
  return {
    healthy: issues.length === 0,
    since: input.since.toISOString(),
    scanned: settlements.length,
    truncated: settlements.length === limit,
    counts,
    issueCount: issues.length,
    issues,
  };
}
