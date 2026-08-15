import { prisma } from "@powerchain/database/prisma";

function decimalText(value: unknown): string {
  if (typeof value === "string" || typeof value === "number" || typeof value === "bigint") return String(value);
  if (value && typeof value === "object" && "toFixed" in value && typeof (value as { toFixed?: unknown }).toFixed === "function") {
    return (value as { toFixed: (digits?: number) => string }).toFixed(0);
  }
  return "0";
}

function add(a: string, b: string): string { return (BigInt(a) + BigInt(b)).toString(); }

export async function serviceFeeRevenueReport(input: { since: Date }) {
  const rows = await prisma.bridgeServiceFeeSettlement.groupBy({
    by: ["sourceChain", "assetId", "status"],
    where: { createdAt: { gte: input.since } },
    _sum: { feeBaseUnits: true, collectedBaseUnits: true },
    _count: { _all: true },
  });

  const totals = new Map<string, {
    sourceChain: string; assetId: string; assessedBaseUnits: string; collectedBaseUnits: string;
    verifiedCount: number; pendingCount: number; manualReviewCount: number; waivedCount: number;
  }>();

  for (const row of rows) {
    const key = `${row.sourceChain}:${row.assetId}`;
    const current = totals.get(key) ?? {
      sourceChain: row.sourceChain, assetId: row.assetId, assessedBaseUnits: "0", collectedBaseUnits: "0",
      verifiedCount: 0, pendingCount: 0, manualReviewCount: 0, waivedCount: 0,
    };
    current.assessedBaseUnits = add(current.assessedBaseUnits, decimalText(row._sum.feeBaseUnits));
    current.collectedBaseUnits = add(current.collectedBaseUnits, decimalText(row._sum.collectedBaseUnits));
    const count = row._count._all;
    if (row.status === "VERIFIED") current.verifiedCount += count;
    else if (row.status === "WAIVED") current.waivedCount += count;
    else if (row.status === "MANUAL_REVIEW") current.manualReviewCount += count;
    else current.pendingCount += count;
    totals.set(key, current);
  }

  return { since: input.since.toISOString(), groups: [...totals.values()].sort((a, b) => `${a.sourceChain}:${a.assetId}`.localeCompare(`${b.sourceChain}:${b.assetId}`)) };
}

export async function serviceFeeOperationalMetrics() {
  const now = new Date();
  const [pending, manualReview, verified24h, dueRetry] = await Promise.all([
    prisma.bridgeServiceFeeSettlement.count({ where: { status: { in: ["ASSESSED", "SUBMITTED", "RETRY_WAIT"] } } }),
    prisma.bridgeServiceFeeSettlement.count({ where: { status: "MANUAL_REVIEW" } }),
    prisma.bridgeServiceFeeSettlement.count({ where: { status: "VERIFIED", verifiedAt: { gte: new Date(now.getTime() - 86_400_000) } } }),
    prisma.bridgeServiceFeeSettlement.count({ where: { status: "RETRY_WAIT", OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }] } }),
  ]);
  return { pending, manualReview, verified24h, dueRetry };
}

function csvCell(value: unknown): string {
  const text = value == null ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function exportServiceFeeLedgerCsv(input: { since: Date; limit?: number }) {
  const limit = Math.max(1, Math.min(10_000, input.limit ?? 5000));
  const rows = await prisma.bridgeServiceFeeSettlement.findMany({
    where: { createdAt: { gte: input.since } },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: limit,
  });
  const header = ["settlementId","transferId","quoteId","routeId","sourceChain","assetId","principalBaseUnits","feeBps","feeBaseUnits","collectedBaseUnits","recipient","policyId","policyVersion","status","sourceTx","attemptCount","failureCode","createdAt","verifiedAt"];
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push([
      row.id,row.transferId,row.quoteId,row.routeId,row.sourceChain,row.assetId,decimalText(row.principalBaseUnits),row.feeBps,decimalText(row.feeBaseUnits),
      row.collectedBaseUnits == null ? "" : decimalText(row.collectedBaseUnits),row.recipient,row.policyId,row.policyVersion,row.status,row.sourceTx ?? "",row.attemptCount,row.failureCode ?? "",row.createdAt.toISOString(),row.verifiedAt?.toISOString() ?? "",
    ].map(csvCell).join(","));
  }
  return { csv: lines.join("\n") + "\n", rows: rows.length, truncated: rows.length === limit };
}
