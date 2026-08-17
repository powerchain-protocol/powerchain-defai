import { Connection, PublicKey } from "@solana/web3.js";
import { getMint, getTransferFeeConfig, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

/** Canonical PWRC does not use the Token-2022 TransferFeeConfig extension. */
export const REQUIRED_PWRC_TRANSFER_FEE_BPS = 0;

export type PwrcToken2022FeeConfig = {
  mint: string;
  tokenProgram: string;
  transferFeeExtensionPresent: boolean;
  configured: boolean;
  basisPoints: number | null;
  maximumFeeBaseUnits: string | null;
  withdrawWithheldAuthority: string | null;
  transferFeeConfigAuthority: string | null;
  receiverTokenAccount: null;
  canonicalPolicyCompliant: boolean;
  verifiedNoTransferFee: boolean;
  /** @deprecated Canonical PWRC never verifies a 250 bps native transfer fee. */
  verified250Bps: false;
};

export async function inspectPwrcToken2022FeeConfig(input: { rpcUrl: string; mint: string }): Promise<PwrcToken2022FeeConfig> {
  const connection = new Connection(input.rpcUrl, "confirmed");
  const mintAddress = new PublicKey(input.mint);
  const mint = await getMint(connection, mintAddress, "confirmed", TOKEN_2022_PROGRAM_ID);
  const config = getTransferFeeConfig(mint);
  if (!config) {
    return {
      mint: mintAddress.toBase58(),
      tokenProgram: TOKEN_2022_PROGRAM_ID.toBase58(),
      transferFeeExtensionPresent: false,
      configured: false,
      basisPoints: null,
      maximumFeeBaseUnits: null,
      withdrawWithheldAuthority: null,
      transferFeeConfigAuthority: null,
      receiverTokenAccount: null,
      canonicalPolicyCompliant: true,
      verifiedNoTransferFee: true,
      verified250Bps: false,
    };
  }
  return {
    mint: mintAddress.toBase58(),
    tokenProgram: TOKEN_2022_PROGRAM_ID.toBase58(),
    transferFeeExtensionPresent: true,
    configured: true,
    basisPoints: Number(config.newerTransferFee.transferFeeBasisPoints),
    maximumFeeBaseUnits: config.newerTransferFee.maximumFee.toString(),
    withdrawWithheldAuthority: config.withdrawWithheldAuthority?.toBase58() ?? null,
    transferFeeConfigAuthority: config.transferFeeConfigAuthority?.toBase58() ?? null,
    receiverTokenAccount: null,
    canonicalPolicyCompliant: false,
    verifiedNoTransferFee: false,
    verified250Bps: false,
  };
}
