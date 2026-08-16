import { Connection, PublicKey } from "@solana/web3.js";
import { getMint, getTransferFeeConfig, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

export const REQUIRED_PWRC_TRANSFER_FEE_BPS = 250;

export type PwrcToken2022FeeConfig = {
  mint: string;
  tokenProgram: string;
  configured: boolean;
  basisPoints: number | null;
  maximumFeeBaseUnits: string | null;
  withdrawWithheldAuthority: string | null;
  transferFeeConfigAuthority: string | null;
  receiverTokenAccount: string | null;
  verified250Bps: boolean;
};

export async function inspectPwrcToken2022FeeConfig(input: { rpcUrl: string; mint: string }): Promise<PwrcToken2022FeeConfig> {
  const connection = new Connection(input.rpcUrl, "confirmed");
  const mintAddress = new PublicKey(input.mint);
  const mint = await getMint(connection, mintAddress, "confirmed", TOKEN_2022_PROGRAM_ID);
  const config = getTransferFeeConfig(mint);
  const receiver = process.env.POWERCHAIN_PWRC_FEE_RECEIVER_TOKEN_ACCOUNT?.trim() || null;
  if (!config) {
    return { mint: mintAddress.toBase58(), tokenProgram: TOKEN_2022_PROGRAM_ID.toBase58(), configured: false, basisPoints: null, maximumFeeBaseUnits: null, withdrawWithheldAuthority: null, transferFeeConfigAuthority: null, receiverTokenAccount: receiver, verified250Bps: false };
  }
  const basisPoints = Number(config.newerTransferFee.transferFeeBasisPoints);
  const withdrawAuthority = config.withdrawWithheldAuthority?.toBase58() ?? null;
  const configAuthority = config.transferFeeConfigAuthority?.toBase58() ?? null;
  const expectedWithdrawAuthority = process.env.POWERCHAIN_PWRC_WITHDRAW_WITHHELD_AUTHORITY?.trim() || null;
  const authorityMatches = !expectedWithdrawAuthority || withdrawAuthority === expectedWithdrawAuthority;
  return {
    mint: mintAddress.toBase58(),
    tokenProgram: TOKEN_2022_PROGRAM_ID.toBase58(),
    configured: true,
    basisPoints,
    maximumFeeBaseUnits: config.newerTransferFee.maximumFee.toString(),
    withdrawWithheldAuthority: withdrawAuthority,
    transferFeeConfigAuthority: configAuthority,
    receiverTokenAccount: receiver,
    verified250Bps: basisPoints === REQUIRED_PWRC_TRANSFER_FEE_BPS && authorityMatches && Boolean(receiver),
  };
}
