"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useSuiWalletSnapshot } from "@/context/sui-wallet-context";

export function useConnectedWallets() {
  const solana = useWallet();
  const sui = useSuiWalletSnapshot();
  return {
    solanaAddress: solana.publicKey?.toBase58() ?? null,
    solanaConnected: solana.connected,
    solanaConnecting: solana.connecting,
    solanaSignMessage: solana.signMessage,
    solanaSignTransaction: solana.signTransaction,
    solanaSendTransaction: solana.sendTransaction,
    suiAddress: sui.address,
    suiConnected: Boolean(sui.address),
    suiWalletName: sui.walletName,
  };
}
