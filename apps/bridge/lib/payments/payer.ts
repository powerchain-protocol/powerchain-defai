export type TransactionPayerChain = "SUI" | "SOLANA";

export function requireConnectedPayer(input: {
  chain: TransactionPayerChain;
  requestedPayer: string;
  connectedSuiAddress?: string | null;
  connectedSolanaAddress?: string | null;
}): string {
  const connected = input.chain === "SUI" ? input.connectedSuiAddress : input.connectedSolanaAddress;
  if (!connected) throw new Error("WALLET_NOT_CONNECTED");
  if (connected !== input.requestedPayer) throw new Error("PAYER_CONNECTED_WALLET_MISMATCH");
  return connected;
}

export const USER_PAYS_FEES_POLICY = Object.freeze({
  gasSponsorAllowed: false,
  relayerPaysNetworkFee: false,
  userPaysNetworkFees: true,
  userSignatureRequired: true,
});
