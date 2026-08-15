import "server-only";
import { fetchJson } from "../../lib/data/http-client";
import { solscanTransactionUrl } from "../../lib/explorers/links";

const ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

function env(name: string) { return process.env[name]?.trim() || null; }

export async function getPwrcTransfers(address: string, options: { paginationToken?: string | null; limit?: number } = {}) {
  if (!ADDRESS.test(address)) throw new Error("invalid Solana address");
  const mint = env("POWERCHAIN_PWRC_SOLANA_MINT");
  const apiKey = env("HELIUS_API_KEY");
  if (!mint) throw new Error("PWRC Solana mint is not configured");
  if (!apiKey) return { source: "unavailable", fallbackReason: "Helius API is not configured", transfers: [], paginationToken: null };
  const base = (env("POWERCHAIN_HELIUS_RPC_API_URL") || "https://mainnet.helius-rpc.com").replace(/\/+$/, "");
  const url = new URL(base);
  url.searchParams.set("api-key", apiKey);
  const limit = Math.max(1, Math.min(options.limit ?? 25, 100));
  const body = {
    jsonrpc: "2.0",
    id: "powerchain-pwrc-transfers",
    method: "getTransfersByAddress",
    params: [address, {
      mint,
      direction: "any",
      commitment: "finalized",
      sortOrder: "desc",
      limit,
      ...(options.paginationToken ? { paginationToken: options.paginationToken } : {}),
    }],
  };
  const response = await fetchJson<any>(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    timeoutMs: 8_000,
    maxAttempts: 2,
    retryBaseMs: 300,
  });
  if (response?.error) throw new Error(response.error?.message || "Helius getTransfersByAddress failed");
  const result = response?.result;
  if (!result || !Array.isArray(result.data)) throw new Error("invalid Helius getTransfersByAddress response");
  return {
    source: "helius-pwrc-transfers" as const,
    fallbackReason: null,
    paginationToken: typeof result.paginationToken === "string" ? result.paginationToken : null,
    transfers: result.data
      .filter((row: any) => row && typeof row.signature === "string" && row.mint === mint && typeof row.amount === "string" && /^\d+$/.test(row.amount))
      .map((row: any) => ({
        signature: row.signature,
        slot: typeof row.slot === "number" ? row.slot : null,
        blockTime: typeof row.blockTime === "number" ? row.blockTime : null,
        type: typeof row.type === "string" ? row.type : "transfer",
        direction: row.fromUserAccount === address ? "out" : row.toUserAccount === address ? "in" : "related",
        from: row.fromUserAccount ?? null,
        to: row.toUserAccount ?? null,
        amountBaseUnits: row.amount,
        decimals: typeof row.decimals === "number" ? row.decimals : 9,
        feeBaseUnits: typeof row.feeAmount === "string" && /^\d+$/.test(row.feeAmount) ? row.feeAmount : null,
        confirmationStatus: row.confirmationStatus ?? "finalized",
        explorerUrl: solscanTransactionUrl(row.signature),
      })),
  };
}
