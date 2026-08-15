"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { ConnectButton } from "@mysten/dapp-kit-react/ui";
import { useConnectedWallets } from "@/lib/wallet/connected-wallets";

function short(value: string | null) {
  return value && value.length > 12 ? `${value.slice(0, 4)}…${value.slice(-4)}` : value;
}

export function HeaderWalletControls() {
  const wallets = useConnectedWallets();
  return (
    <div className="flex items-center gap-2" aria-label="Wallet connections">
      <div className="hidden sm:block"><WalletMultiButton /></div>
      <div className="sm:hidden"><WalletMultiButton>{wallets.solanaAddress ? short(wallets.solanaAddress) : "SOL"}</WalletMultiButton></div>
      <ConnectButton><span>Sui</span></ConnectButton>
    </div>
  );
}
