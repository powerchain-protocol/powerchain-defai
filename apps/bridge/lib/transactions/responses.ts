export type TransactionResponseState = "prepared" | "submitted" | "confirmed" | "failed";
export type TransactionResponse = { state: TransactionResponseState; chain: "SOLANA" | "SUI"; digest: string | null; message: string; authoritativeForBridgeAccounting: false };
export function transactionResponse(input: Omit<TransactionResponse,"authoritativeForBridgeAccounting">): TransactionResponse { return { ...input, authoritativeForBridgeAccounting: false }; }
