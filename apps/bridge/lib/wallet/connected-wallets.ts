"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useCurrentAccount, useCurrentWallet } from "@mysten/dapp-kit-react";

export function useConnectedWallets() {
  const solana = useWallet();
  const suiAccount = useCurrentAccount();
  const suiWallet = useCurrentWallet();
  return {
    solanaAddress: solana.publicKey?.toBase58() ?? null,
    solanaConnected: solana.connected,
    solanaConnecting: solana.connecting,
    solanaSignMessage: solana.signMessage,
    suiAddress: suiAccount?.address ?? null,
    suiConnected: Boolean(suiAccount),
    suiWalletName: suiWallet?.name ?? null,
  };
}
