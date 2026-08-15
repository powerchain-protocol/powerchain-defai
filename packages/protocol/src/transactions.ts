export type ChainTransactionRef = { chain: "solana" | "sui"; id: string; submittedAt: string };
export function normalizeTransactionId(chain: "solana" | "sui", id: string): string {
  const v = id.trim();
  if (!v) throw new Error("TRANSACTION_ID_REQUIRED");
  if (chain === "solana" && !/^[1-9A-HJ-NP-Za-km-z]{64,128}$/.test(v)) throw new Error("INVALID_SOLANA_SIGNATURE");
  if (chain === "sui" && !/^[1-9A-HJ-NP-Za-km-z]{32,64}$/.test(v)) throw new Error("INVALID_SUI_DIGEST");
  return v;
}
export function transactionRef(chain: "solana" | "sui", id: string): ChainTransactionRef {
  return { chain, id: normalizeTransactionId(chain, id), submittedAt: new Date().toISOString() };
}
