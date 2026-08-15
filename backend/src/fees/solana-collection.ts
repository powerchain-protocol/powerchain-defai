import { PublicKey, type TransactionInstruction } from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

export interface SolanaServiceFeeCollectionPlan {
  readonly chain: "SOLANA";
  readonly mint: string;
  readonly payer: string;
  readonly owner: string;
  readonly recipientWallet: string;
  readonly sourceTokenAccount: string;
  readonly recipientTokenAccount: string;
  readonly feeBaseUnits: string;
  readonly decimals: number;
  readonly tokenProgram: string;
  readonly instructions: readonly TransactionInstruction[];
}

function positiveBaseUnits(value: string): bigint {
  if (!/^[1-9][0-9]*$/.test(value)) throw new Error("SERVICE_FEE_AMOUNT_INVALID");
  return BigInt(value);
}

/**
 * Build the source-chain Token-2022 fee instructions. The caller owns signing.
 * This never moves the bridge principal and never exposes or accepts a private key.
 */
export function buildSolanaToken2022ServiceFeeInstructions(input: {
  mint: string;
  payer: string;
  owner?: string;
  recipientWallet: string;
  feeBaseUnits: string;
  decimals?: number;
  sourceTokenAccount?: string;
}): SolanaServiceFeeCollectionPlan {
  const mint = new PublicKey(input.mint);
  const payer = new PublicKey(input.payer);
  const owner = new PublicKey(input.owner?.trim() || input.payer);
  const recipient = new PublicKey(input.recipientWallet);
  const decimals = input.decimals ?? 9;
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 18) throw new Error("SERVICE_FEE_DECIMALS_INVALID");
  const amount = positiveBaseUnits(input.feeBaseUnits);

  const sourceAta = input.sourceTokenAccount?.trim()
    ? new PublicKey(input.sourceTokenAccount)
    : getAssociatedTokenAddressSync(mint, owner, false, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
  const recipientAta = getAssociatedTokenAddressSync(mint, recipient, false, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);

  const createRecipientAta = createAssociatedTokenAccountIdempotentInstruction(
    payer,
    recipientAta,
    recipient,
    mint,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
  const transferFee = createTransferCheckedInstruction(
    sourceAta,
    mint,
    recipientAta,
    owner,
    amount,
    decimals,
    [],
    TOKEN_2022_PROGRAM_ID,
  );

  return Object.freeze({
    chain: "SOLANA" as const,
    mint: mint.toBase58(),
    payer: payer.toBase58(),
    owner: owner.toBase58(),
    recipientWallet: recipient.toBase58(),
    sourceTokenAccount: sourceAta.toBase58(),
    recipientTokenAccount: recipientAta.toBase58(),
    feeBaseUnits: amount.toString(),
    decimals,
    tokenProgram: TOKEN_2022_PROGRAM_ID.toBase58(),
    instructions: Object.freeze([createRecipientAta, transferFee]),
  });
}
