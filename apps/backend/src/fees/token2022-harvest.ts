import { PublicKey, type TransactionInstruction } from "@solana/web3.js";
import {
  createHarvestWithheldTokensToMintInstruction,
  createWithdrawWithheldTokensFromMintInstruction,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

export type PwrcWithheldFeeHarvestPlan = {
  mint: string;
  withdrawWithheldAuthority: string;
  receiverTokenAccount: string;
  sourceTokenAccounts: readonly string[];
  tokenProgram: string;
  instructions: readonly TransactionInstruction[];
};

/**
 * Builds, but never signs, the standard Token-2022 withheld-fee harvest path.
 * Source accounts can be harvested permissionlessly to the mint; withdrawal from
 * the mint to the configured treasury/fee token account requires the configured
 * withdraw-withheld authority signature.
 */
export function buildPwrcWithheldFeeHarvestPlan(input: {
  mint: string;
  withdrawWithheldAuthority: string;
  receiverTokenAccount: string;
  sourceTokenAccounts: readonly string[];
}): PwrcWithheldFeeHarvestPlan {
  const mint = new PublicKey(input.mint);
  const authority = new PublicKey(input.withdrawWithheldAuthority);
  const receiver = new PublicKey(input.receiverTokenAccount);
  const sources = [...new Set(input.sourceTokenAccounts.map((value) => new PublicKey(value).toBase58()))].map((value) => new PublicKey(value));
  const instructions: TransactionInstruction[] = [];
  if (sources.length > 0) instructions.push(createHarvestWithheldTokensToMintInstruction(mint, sources, TOKEN_2022_PROGRAM_ID));
  instructions.push(createWithdrawWithheldTokensFromMintInstruction(mint, receiver, authority, [], TOKEN_2022_PROGRAM_ID));
  return Object.freeze({
    mint: mint.toBase58(),
    withdrawWithheldAuthority: authority.toBase58(),
    receiverTokenAccount: receiver.toBase58(),
    sourceTokenAccounts: Object.freeze(sources.map((source) => source.toBase58())),
    tokenProgram: TOKEN_2022_PROGRAM_ID.toBase58(),
    instructions: Object.freeze(instructions),
  });
}
