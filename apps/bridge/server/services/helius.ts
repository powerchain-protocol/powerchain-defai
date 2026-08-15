import "server-only";
import { fetchJson } from "../../lib/data/http-client";

const SOLANA_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const SOLANA_SIGNATURE = /^[1-9A-HJ-NP-Za-km-z]{64,100}$/;

function env(name: string) {
  const value = process.env[name]?.trim();
  return value || null;
}

function heliusEnhancedApiBase() {
  return (env("POWERCHAIN_HELIUS_ENHANCED_API_URL") || "https://api-mainnet.helius-rpc.com").replace(/\/+$/, "");
}

function heliusRpcApiBase() {
  return (env("POWERCHAIN_HELIUS_RPC_API_URL") || "https://mainnet.helius-rpc.com").replace(/\/+$/, "");
}

export type HeliusEnhancedTransaction = {
  signature: string;
  slot?: number;
  timestamp?: number | null;
  type?: string | null;
  source?: string | null;
  description?: string | null;
  fee?: number | null;
  feePayer?: string | null;
  nativeTransfers?: Array<{ fromUserAccount?: string | null; toUserAccount?: string | null; amount?: number | null }>;
  tokenTransfers?: Array<{
    fromUserAccount?: string | null;
    toUserAccount?: string | null;
    fromTokenAccount?: string | null;
    toTokenAccount?: string | null;
    tokenAmount?: number | null;
    mint?: string | null;
  }>;
};

export type HeliusAddressTransaction = {
  signature: string;
  slot?: number | null;
  transactionIndex?: number | null;
  err?: unknown;
  memo?: string | null;
  blockTime?: number | null;
  confirmationStatus?: string | null;
};

export function heliusApiConfigured() {
  return Boolean(env("HELIUS_API_KEY"));
}

export function heliusEnhancedApiConfigured() {
  return heliusApiConfigured();
}

export async function getHeliusTransactionsForAddress(
  address: string,
  options: { paginationToken?: string | null; limit?: number } = {},
) {
  if (!SOLANA_ADDRESS.test(address)) throw new Error("invalid Solana address");
  const apiKey = env("HELIUS_API_KEY");
  if (!apiKey) throw new Error("Helius RPC API is not configured");
  const limit = Math.max(1, Math.min(options.limit ?? 25, 100));
  const url = new URL(heliusRpcApiBase());
  url.searchParams.set("api-key", apiKey);

  const result = await fetchJson<any>(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "powerchain-wallet-history",
      method: "getTransactionsForAddress",
      params: [
        address,
        {
          transactionDetails: "signatures",
          limit,
          ...(options.paginationToken ? { paginationToken: options.paginationToken } : {}),
        },
      ],
    }),
    timeoutMs: 8_000,
    maxAttempts: 2,
    retryBaseMs: 300,
  });

  if (result?.error) throw new Error(result.error?.message || "Helius getTransactionsForAddress failed");
  const payload = result?.result;
  if (!payload || !Array.isArray(payload.data)) throw new Error("invalid Helius getTransactionsForAddress response");
  return {
    data: payload.data.filter((row: any) => row && typeof row.signature === "string") as HeliusAddressTransaction[],
    paginationToken: typeof payload.paginationToken === "string" ? payload.paginationToken : null,
  };
}

/**
 * Compatibility fallback only. Helius recommends getTransactionsForAddress/getTransaction
 * for new integrations; this parser endpoint is retained so existing deployments can degrade
 * gracefully while migrating.
 */
export async function getHeliusAddressTransactions(address: string, options: { before?: string | null; limit?: number } = {}) {
  if (!SOLANA_ADDRESS.test(address)) throw new Error("invalid Solana address");
  const apiKey = env("HELIUS_API_KEY");
  if (!apiKey) throw new Error("Helius Enhanced Transactions API is not configured");
  const url = new URL(`${heliusEnhancedApiBase()}/v0/addresses/${encodeURIComponent(address)}/transactions`);
  url.searchParams.set("api-key", apiKey);
  const limit = Math.max(1, Math.min(options.limit ?? 25, 100));
  url.searchParams.set("limit", String(limit));
  if (options.before && SOLANA_SIGNATURE.test(options.before)) url.searchParams.set("before", options.before);
  const rows = await fetchJson<HeliusEnhancedTransaction[]>(url, {
    timeoutMs: 8_000,
    maxAttempts: 2,
    retryBaseMs: 300,
  });
  if (!Array.isArray(rows)) throw new Error("invalid Helius transaction response");
  return rows.filter((row) => row && typeof row.signature === "string").slice(0, limit);
}
