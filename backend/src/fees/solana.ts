import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import type { ServiceFeeVerificationResult } from "./types";

function parsedInfo(ix: unknown): Record<string, unknown> | null {
  if (!ix || typeof ix !== "object") return null;
  const parsed = (ix as { parsed?: unknown }).parsed;
  if (!parsed || typeof parsed !== "object") return null;
  const info = (parsed as { info?: unknown }).info;
  return info && typeof info === "object" ? info as Record<string, unknown> : null;
}

export async function verifySolanaToken2022ServiceFee(input: {
  rpcUrls: readonly string[];
  signature: string;
  mint: string;
  recipientWallet: string;
  expectedBaseUnits: string;
  timeoutMs?: number;
}): Promise<ServiceFeeVerificationResult> {
  const mint = new PublicKey(input.mint);
  const recipient = new PublicKey(input.recipientWallet);
  const expectedDestination = getAssociatedTokenAddressSync(mint, recipient, false, TOKEN_2022_PROGRAM_ID).toBase58();
  let lastError = "SERVICE_FEE_SOLANA_RPC_UNAVAILABLE";

  for (const rpc of input.rpcUrls.filter(Boolean)) {
    try {
      const connection = new Connection(rpc, { commitment: "finalized", confirmTransactionInitialTimeout: input.timeoutMs ?? 10_000 });
      const tx = await connection.getParsedTransaction(input.signature, { commitment: "finalized", maxSupportedTransactionVersion: 0 });
      if (!tx) { lastError = "SERVICE_FEE_SOLANA_TX_NOT_FINALIZED"; continue; }
      if (tx.meta?.err) {
        return { verified: false, finalized: true, sourceTx: input.signature, expectedBaseUnits: input.expectedBaseUnits, recipient: input.recipientWallet, errorCode: "SERVICE_FEE_SOLANA_TX_FAILED", evidence: { rpc, metaError: tx.meta.err } };
      }
      const instructions = [
        ...tx.transaction.message.instructions,
        ...(tx.meta?.innerInstructions ?? []).flatMap((group) => group.instructions),
      ];
      for (const ix of instructions) {
        if (!("programId" in ix) || ix.programId.toBase58() !== TOKEN_2022_PROGRAM_ID.toBase58()) continue;
        const parsed = "parsed" in ix ? ix.parsed as { type?: string; info?: unknown } : undefined;
        if (!parsed || parsed.type !== "transferChecked") continue;
        const info = parsedInfo(ix);
        if (!info) continue;
        const tokenAmount = info.tokenAmount && typeof info.tokenAmount === "object" ? info.tokenAmount as Record<string, unknown> : {};
        const amount = String(tokenAmount.amount ?? "");
        if (String(info.mint ?? "") !== mint.toBase58()) continue;
        if (String(info.destination ?? "") !== expectedDestination) continue;
        if (amount !== input.expectedBaseUnits) continue;
        return {
          verified: true,
          finalized: true,
          sourceTx: input.signature,
          expectedBaseUnits: input.expectedBaseUnits,
          recipient: input.recipientWallet,
          evidence: { rpc, program: TOKEN_2022_PROGRAM_ID.toBase58(), mint: mint.toBase58(), destinationAta: expectedDestination, amount },
        };
      }
      lastError = "SERVICE_FEE_SOLANA_TRANSFER_NOT_FOUND";
    } catch (error) {
      lastError = error instanceof Error ? error.message : "SERVICE_FEE_SOLANA_RPC_ERROR";
    }
  }
  return { verified: false, finalized: false, sourceTx: input.signature, expectedBaseUnits: input.expectedBaseUnits, recipient: input.recipientWallet, errorCode: lastError, evidence: {} };
}
