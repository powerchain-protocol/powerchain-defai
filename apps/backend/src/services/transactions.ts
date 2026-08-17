import { prisma } from "@powerchain/database/prisma";

export type TransactionChain = "SOLANA" | "SUI";
export type TransactionReference = { chain: TransactionChain; id: string; submittedAt: string };

export const BRIDGE_HISTORY_STATUSES = [
  "CREATED",
  "SOURCE_SUBMITTING",
  "SOURCE_SUBMITTED",
  "SOURCE_FINALIZED",
  "MESSAGE_OBSERVED",
  "DESTINATION_SUBMITTED",
  "DESTINATION_FINALIZED",
  "RECONCILIATION_REQUIRED",
  "COMPLETED",
  "FAILED",
] as const;

export type BridgeHistoryStatus = (typeof BRIDGE_HISTORY_STATUSES)[number];
export type BridgeHistoryItem = {
  id: string;
  routeId: string;
  direction: "SOLANA_TO_SUI" | "SUI_TO_SOLANA";
  status: BridgeHistoryStatus;
  principalBaseUnits: string;
  sourceAddress: string;
  destinationAddress: string;
  sourceTx: string | null;
  destinationTx: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BridgeHistoryQuery = {
  address?: string | null;
  status?: BridgeHistoryStatus | null;
  limit?: number;
  cursor?: string | null;
};

export type BridgeHistoryPage = {
  data: BridgeHistoryItem[];
  pagination: { nextCursor: string | null; hasNextPage: boolean };
};

type BridgeHistoryDbRow = {
  id: string;
  routeId: string;
  direction: BridgeHistoryItem["direction"];
  status: BridgeHistoryStatus;
  principalBaseUnits: { toFixed(digits?: number): string };
  sourceAddress: string;
  destinationAddress: string;
  sourceTx: string | null;
  destinationTx: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const SOLANA_SIGNATURE = /^[1-9A-HJ-NP-Za-km-z]{64,100}$/;
const SUI_DIGEST = /^[A-Za-z0-9]{32,80}$/;

export function normalizeTransactionId(chain: TransactionChain, value: string): string {
  const id = value.trim();
  if (!id) throw new Error("TRANSACTION_ID_REQUIRED");
  if (chain === "SOLANA" && !SOLANA_SIGNATURE.test(id)) throw new Error("INVALID_SOLANA_SIGNATURE");
  if (chain === "SUI" && !SUI_DIGEST.test(id)) throw new Error("INVALID_SUI_DIGEST");
  return id;
}

export function transactionReference(chain: TransactionChain, id: string): TransactionReference {
  return { chain, id: normalizeTransactionId(chain, id), submittedAt: new Date().toISOString() };
}

export function transactionFinalityNotice(chain: TransactionChain) {
  return chain === "SOLANA"
    ? "Explorer/indexer visibility is informational; Bridge completion still requires finalized RPC evidence and reconciliation."
    : "Explorer/indexer visibility is informational; Bridge completion still requires Sui finality evidence and reconciliation.";
}

export function parseBridgeHistoryStatus(value: string | null | undefined): BridgeHistoryStatus | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  return BRIDGE_HISTORY_STATUSES.find((status) => status === normalized) ?? null;
}

export function boundedHistoryLimit(value: number | string | null | undefined, fallback = 25): number {
  const numeric = typeof value === "number" ? value : Number.parseInt(value ?? "", 10);
  return Number.isFinite(numeric) ? Math.max(1, Math.min(100, Math.trunc(numeric))) : fallback;
}

export async function listBridgeTransactions(query: BridgeHistoryQuery = {}): Promise<BridgeHistoryPage> {
  const address = query.address?.trim() || null;
  const limit = boundedHistoryLimit(query.limit);
  const cursor = query.cursor?.trim() || null;
  const rows = await prisma.bridgeTransfer.findMany({
    where: {
      ...(address ? { OR: [{ sourceAddress: address }, { destinationAddress: address }] } : {}),
      ...(query.status ? { status: query.status } : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  }) as BridgeHistoryDbRow[];
  const hasNextPage = rows.length > limit;
  const page = hasNextPage ? rows.slice(0, limit) : rows;
  return {
    data: page.map((row: BridgeHistoryDbRow) => ({
      id: row.id,
      routeId: row.routeId,
      direction: row.direction,
      status: row.status,
      principalBaseUnits: row.principalBaseUnits.toFixed(0),
      sourceAddress: row.sourceAddress,
      destinationAddress: row.destinationAddress,
      sourceTx: row.sourceTx,
      destinationTx: row.destinationTx,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
    pagination: { nextCursor: hasNextPage ? page.at(-1)?.id ?? null : null, hasNextPage },
  };
}
