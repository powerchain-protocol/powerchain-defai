import { normalizeTransactionId } from "@powerchain/backend/services/transactions";
import "server-only";

import { getSolanaRpc, getSuiRpc } from "../rpc/providers";
import { getSolanaPwrcSnapshot, getSuiWpwrcSnapshot } from "./chain-data";
import {
  getHeliusAddressTransactions,
  getHeliusTransactionsForAddress,
  heliusApiConfigured,
} from "./helius";
import { fetchJson } from "../../lib/data/http-client";
import { solscanAccountUrl, solscanTransactionUrl, suiscanAccountUrl, suiscanTransactionUrl } from "@powerchain/backend/services/explorer";

const SOLANA_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const SOLANA_SIGNATURE = /^[1-9A-HJ-NP-Za-km-z]{64,100}$/;
const SUI_ADDRESS = /^0x[a-fA-F0-9]{64}$/;
const SUI_DIGEST = /^[A-Za-z0-9]{32,80}$/;

function normalizeSui(value: string) {
  if (!SUI_ADDRESS.test(value)) throw new Error("invalid Sui address");
  return value.toLowerCase();
}

function limitValue(value: number | undefined, max = 100) {
  return Math.max(1, Math.min(value ?? 25, max));
}


type SuiHistoryRow = {
  digest?: unknown;
  sender?: { address?: unknown } | null;
  effects?: { status?: unknown; timestamp?: unknown } | { status?: { status?: unknown } } | null;
  transaction?: { data?: { sender?: unknown } } | null;
  timestampMs?: unknown;
};

type SuiGraphqlHistoryResponse = {
  data?: { transactions?: { pageInfo?: { endCursor?: unknown; hasNextPage?: unknown }; nodes?: unknown[] } };
};

type SuiRpcHistoryResponse = { nextCursor?: unknown; hasNextPage?: unknown; data?: unknown[] };
type SuiGraphqlTransactionResponse = { data?: { transactionBlock?: unknown } };

function isSuiHistoryRow(value: unknown): value is SuiHistoryRow & { digest: string } {
  return Boolean(value && typeof value === "object" && "digest" in value && typeof (value as { digest?: unknown }).digest === "string");
}

function nestedString(value: unknown, ...keys: string[]): string | null {
  let current: unknown = value;
  for (const key of keys) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return null;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" ? current : null;
}

type SolanaSignatureInfo = {
  signature: string;
  slot: number;
  blockTime?: number | null;
  err?: unknown;
  memo?: string | null;
  confirmationStatus?: string | null;
};

function normalizeSolanaSignatureRows(rows: SolanaSignatureInfo[]) {
  return rows.map((row) => ({
    signature: row.signature,
    slot: row.slot,
    timestamp: row.blockTime ?? null,
    status: row.err == null ? "success" : "failed",
    confirmationStatus: row.confirmationStatus ?? null,
    memo: row.memo ?? null,
    explorerUrl: solscanTransactionUrl(row.signature),
  }));
}

export async function getSolanaWalletHistory(
  address: string,
  options: { before?: string | null; paginationToken?: string | null; limit?: number } = {},
) {
  if (!SOLANA_ADDRESS.test(address)) throw new Error("invalid Solana address");
  const limit = limitValue(options.limit);
  const failures: string[] = [];

  // Preferred indexed path. Helius currently recommends getTransactionsForAddress for new history integrations.
  if (heliusApiConfigured()) {
    try {
      const result = await getHeliusTransactionsForAddress(address, {
        ...(options.paginationToken !== undefined ? { paginationToken: options.paginationToken } : {}),
        limit,
      });
      return {
        source: "helius-rpc-history" as const,
        enhanced: false,
        fallback: false,
        fallbackReason: null,
        pagination: {
          nextCursor: result.paginationToken,
          hasNextPage: Boolean(result.paginationToken),
          cursorType: "helius-pagination-token" as const,
        },
        transactions: normalizeSolanaSignatureRows(result.data as SolanaSignatureInfo[]),
      };
    } catch (error) {
      failures.push(`helius-rpc:${error instanceof Error ? error.message : "unavailable"}`);
    }

    // Compatibility-only fallback for deployments still relying on the older enhanced parser endpoint.
    try {
      const enhanced = await getHeliusAddressTransactions(address, {
        ...(options.before !== undefined ? { before: options.before } : {}),
        limit,
      });
      return {
        source: "helius-enhanced-compat" as const,
        enhanced: true,
        fallback: true,
        fallbackReason: failures.at(-1) ?? "preferred Helius history unavailable",
        pagination: {
          nextCursor: enhanced.length === limit ? enhanced.at(-1)?.signature ?? null : null,
          hasNextPage: enhanced.length === limit,
          cursorType: "signature" as const,
        },
        transactions: enhanced.map((row) => ({
          signature: row.signature,
          slot: row.slot ?? null,
          timestamp: row.timestamp ?? null,
          status: "indexed",
          type: row.type ?? null,
          source: row.source ?? null,
          description: row.description ?? null,
          feeLamports: row.fee ?? null,
          feePayer: row.feePayer ?? null,
          nativeTransfers: row.nativeTransfers ?? [],
          tokenTransfers: row.tokenTransfers ?? [],
          explorerUrl: solscanTransactionUrl(row.signature),
        })),
      };
    } catch (error) {
      failures.push(`helius-enhanced:${error instanceof Error ? error.message : "unavailable"}`);
    }
  }

  const rpc = getSolanaRpc();
  const config: Record<string, unknown> = { limit, commitment: "finalized" };
  if (options.before && SOLANA_SIGNATURE.test(options.before)) config.before = options.before;
  const signatures = await rpc.client.request<SolanaSignatureInfo[]>("getSignaturesForAddress", [address, config], {
    cacheTtlMs: 1_000,
    staleIfErrorMs: 5_000,
    requestBudgetMs: 8_000,
  });
  const rows = Array.isArray(signatures) ? signatures : [];
  return {
    source: "solana-rpc" as const,
    enhanced: false,
    fallback: failures.length > 0,
    fallbackReason: failures.length ? failures.join(" | ") : null,
    pagination: {
      nextCursor: rows.length === limit ? rows.at(-1)?.signature ?? null : null,
      hasNextPage: rows.length === limit,
      cursorType: "signature" as const,
    },
    transactions: normalizeSolanaSignatureRows(rows),
  };
}

export async function getSolanaWalletOverview(
  address: string,
  options: { before?: string | null; paginationToken?: string | null; limit?: number } = {},
) {
  if (!SOLANA_ADDRESS.test(address)) throw new Error("invalid Solana address");
  const [balance, history] = await Promise.all([
    getSolanaPwrcSnapshot(address),
    getSolanaWalletHistory(address, options),
  ]);
  return {
    chain: "SOLANA" as const,
    address,
    balance,
    history,
    explorer: { account: solscanAccountUrl(address) },
    checkedAt: new Date().toISOString(),
    authoritativeForBridgeAccounting: false as const,
  };
}

function suiGraphqlUrl() {
  return process.env.POWERCHAIN_SUI_GRAPHQL_URL?.trim() || null;
}

export async function getSuiWalletHistory(addressInput: string, options: { cursor?: string | null; limit?: number } = {}) {
  const address = normalizeSui(addressInput);
  const limit = limitValue(options.limit, 50);
  const graphqlUrl = suiGraphqlUrl();
  const failures: string[] = [];
  if (graphqlUrl) {
    try {
      const body = {
        query: `query PowerChainWalletTransactions($address: SuiAddress!, $first: Int!, $after: String) {
          transactions(first: $first, after: $after, filter: { affectedAddress: $address }) {
            pageInfo { hasNextPage endCursor }
            nodes {
              digest
              sender { address }
              effects { status timestamp }
            }
          }
        }`,
        variables: { address, first: limit, after: options.cursor || null },
      };
      const result = await fetchJson<SuiGraphqlHistoryResponse>(graphqlUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        timeoutMs: 8_000,
        maxAttempts: 2,
      });
      const transactions = result?.data?.transactions;
      if (transactions && Array.isArray(transactions.nodes)) {
        return {
          source: "sui-graphql" as const,
          fallback: false,
          fallbackReason: null,
          pagination: {
            nextCursor: transactions.pageInfo?.endCursor ?? null,
            hasNextPage: Boolean(transactions.pageInfo?.hasNextPage),
            cursorType: "graphql-cursor" as const,
          },
          transactions: transactions.nodes
            .filter(isSuiHistoryRow)
            .map((row) => ({
              digest: row.digest,
              sender: nestedString(row, "sender", "address"),
              status: nestedString(row, "effects", "status"),
              timestamp: typeof (row.effects as { timestamp?: unknown } | undefined)?.timestamp === "number" ? (row.effects as { timestamp: number }).timestamp : null,
              explorerUrl: suiscanTransactionUrl(row.digest),
            })),
        };
      }
      throw new Error("invalid GraphQL transaction response");
    } catch (error) {
      failures.push(`sui-graphql:${error instanceof Error ? error.message : "unavailable"}`);
    }
  }

  const rpc = getSuiRpc();
  const result = await rpc.client.request<SuiRpcHistoryResponse>(
    "suix_queryTransactionBlocks",
    [
      { filter: { FromOrToAddress: { addr: address } }, options: { showEffects: true, showInput: true } },
      options.cursor || null,
      limit,
      true,
    ],
    { cacheTtlMs: 1_000, staleIfErrorMs: 5_000, requestBudgetMs: 8_000 },
  );
  return {
    source: "sui-rpc-compat" as const,
    fallback: failures.length > 0,
    fallbackReason: failures.length ? failures.join(" | ") : null,
    pagination: {
      nextCursor: result?.nextCursor ?? null,
      hasNextPage: Boolean(result?.hasNextPage),
      cursorType: "sui-rpc-cursor" as const,
    },
    transactions: (Array.isArray(result?.data) ? result.data : [])
      .filter(isSuiHistoryRow)
      .map((row) => ({
        digest: row.digest,
        sender: nestedString(row, "transaction", "data", "sender"),
        status: nestedString(row, "effects", "status", "status"),
        timestamp: typeof row.timestampMs === "string" || typeof row.timestampMs === "number" ? Math.floor(Number(row.timestampMs) / 1000) : null,
        explorerUrl: suiscanTransactionUrl(row.digest),
      })),
  };
}

export async function getSuiWalletOverview(addressInput: string, options: { cursor?: string | null; limit?: number } = {}) {
  const address = normalizeSui(addressInput);
  const [balance, history] = await Promise.all([
    getSuiWpwrcSnapshot(address),
    getSuiWalletHistory(address, options),
  ]);
  return {
    chain: "SUI" as const,
    address,
    balance,
    history,
    explorer: { account: suiscanAccountUrl(address) },
    checkedAt: new Date().toISOString(),
    authoritativeForBridgeAccounting: false as const,
  };
}

export async function getSolanaTransactionDetails(signature: string) {
  signature = normalizeTransactionId("SOLANA", signature);
  const rpc = getSolanaRpc();
  const transaction = await rpc.client.request<unknown>(
    "getTransaction",
    [signature, { commitment: "finalized", encoding: "jsonParsed", maxSupportedTransactionVersion: 0 }],
    { cacheTtlMs: 2_000, staleIfErrorMs: 10_000, requestBudgetMs: 8_000 },
  );
  if (!transaction) return null;
  return {
    signature,
    transaction,
    explorerUrl: solscanTransactionUrl(signature),
    source: "solana-rpc",
    authoritativeForBridgeAccounting: false as const,
  };
}

export async function getSuiTransactionDetails(digest: string) {
  digest = normalizeTransactionId("SUI", digest);
  const graphqlUrl = suiGraphqlUrl();
  if (graphqlUrl) {
    try {
      const result = await fetchJson<SuiGraphqlTransactionResponse>(graphqlUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          query: `query PowerChainTransaction($digest: String!) { transactionBlock(digest: $digest) { digest sender { address } effects { status timestamp } } }`,
          variables: { digest },
        }),
        timeoutMs: 8_000,
        maxAttempts: 2,
      });
      const tx = result?.data?.transactionBlock;
      if (tx) {
        return {
          digest,
          transaction: tx,
          explorerUrl: suiscanTransactionUrl(digest),
          source: "sui-graphql",
          authoritativeForBridgeAccounting: false as const,
        };
      }
    } catch {
      // Compatibility fallback below.
    }
  }
  const rpc = getSuiRpc();
  const transaction = await rpc.client.request<unknown>(
    "sui_getTransactionBlock",
    [digest, { showInput: true, showEffects: true, showEvents: true, showBalanceChanges: true, showObjectChanges: true }],
    { cacheTtlMs: 2_000, staleIfErrorMs: 10_000, requestBudgetMs: 8_000 },
  );
  if (!transaction) return null;
  return {
    digest,
    transaction,
    explorerUrl: suiscanTransactionUrl(digest),
    source: "sui-rpc-compat",
    authoritativeForBridgeAccounting: false as const,
  };
}
