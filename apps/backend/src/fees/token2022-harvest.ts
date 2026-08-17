import { PublicKey, type TransactionInstruction } from "@solana/web3.js";

export type PwrcWithheldFeeHarvestPlan = {
  mint: string;
  withdrawWithheldAuthority: string;
  receiverTokenAccount: string;
  sourceTokenAccounts: readonly string[];
  tokenProgram: string;
  instructions: readonly TransactionInstruction[];
};

/**
 * Canonical PWRC intentionally has no Token-2022 TransferFeeConfig extension.
 * This compatibility export now fails closed so older callers cannot accidentally
 * build a withheld-fee collection flow for the canonical mint.
 */
export function buildPwrcWithheldFeeHarvestPlan(_input: {
  mint: string;
  withdrawWithheldAuthority: string;
  receiverTokenAccount: string;
  sourceTokenAccounts: readonly string[];
}): PwrcWithheldFeeHarvestPlan {
  throw new Error("PWRC_NATIVE_TRANSFER_FEE_DISABLED");
}

/** Validate an address without constructing fee-withdrawal instructions. */
export function validateLegacyPwrcFeeAccount(value: string): string {
  return new PublicKey(value).toBase58();
}
