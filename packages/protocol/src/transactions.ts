export type ChainTransactionRef = { chain: "solana" | "sui"; id: string; submittedAt: string };
const SOLANA_SIGNATURE=/^[1-9A-HJ-NP-Za-km-z]{64,100}$/;
const SUI_DIGEST=/^[A-Za-z0-9]{32,80}$/;
export function normalizeTransactionId(chain: "solana" | "sui", id: string): string { const v=id.trim(); if(!v) throw new Error("TRANSACTION_ID_REQUIRED"); if(chain==="solana"&&!SOLANA_SIGNATURE.test(v)) throw new Error("INVALID_SOLANA_SIGNATURE"); if(chain==="sui"&&!SUI_DIGEST.test(v)) throw new Error("INVALID_SUI_DIGEST"); return v; }
export function transactionRef(chain: "solana" | "sui", id: string): ChainTransactionRef { return { chain, id: normalizeTransactionId(chain,id), submittedAt:new Date().toISOString() }; }
