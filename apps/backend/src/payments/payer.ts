import { normalizeChainAddress, type BlockchainChain } from "@powerchain/blockchain";

export type PayerChain = BlockchainChain;

export function validateTransactionPayer(chain: PayerChain, payer: string): string {
  const value = payer.trim();
  if (!value) throw new Error("PAYER_REQUIRED");
  return normalizeChainAddress(chain, value);
}

export function assertConnectedWalletPayer(input: { chain: PayerChain; payer: string; connectedWallet: string }): string {
  const payer = validateTransactionPayer(input.chain, input.payer);
  const connected = validateTransactionPayer(input.chain, input.connectedWallet);
  if (payer !== connected) throw new Error("PAYER_CONNECTED_WALLET_MISMATCH");
  return payer;
}

export const USER_PAYS_TRANSACTION_FEES = Object.freeze({ sponsored: false, gasOwner: "connected-wallet" as const, userSignatureRequired: true });
