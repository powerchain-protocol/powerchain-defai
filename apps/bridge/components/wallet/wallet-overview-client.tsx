"use client";
import { WalletOverviewShell } from "./wallet-overview-shell";
import { useConnectedWallets } from "@/lib/wallet/connected-wallets";
export function WalletOverviewClient() {
  const wallets = useConnectedWallets();
  return <WalletOverviewShell solanaAddress={wallets.solanaAddress} suiAddress={wallets.suiAddress} />;
}
