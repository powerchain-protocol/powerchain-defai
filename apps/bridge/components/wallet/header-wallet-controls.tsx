"use client";

import { useCallback, useState } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { ConnectButton } from "@mysten/dapp-kit-react/ui";
import { useConnectedWallets } from "@/lib/wallet/connected-wallets";
import { WalletConnectModal } from "./wallet-connect-modal";

function short(value: string | null): string | null {
  return value && value.length > 12 ? `${value.slice(0, 4)}…${value.slice(-4)}` : value;
}

function WalletGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 7.5h14a2 2 0 0 1 2 2v8.5H6a2 2 0 0 1-2-2V7.5Z" />
      <path d="M4.5 7.5 16 4v3.5" />
      <path d="M15 12h5" />
    </svg>
  );
}

export function HeaderWalletControls() {
  const wallets = useConnectedWallets();
  const [open, setOpen] = useState(false);
  const closeModal = useCallback(() => setOpen(false), []);
  const connected = Boolean(wallets.solanaAddress || wallets.suiAddress);

  return (
    <div className="flex items-center gap-2" aria-label="Wallet connections">
      {!connected ? (
        <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-10 min-w-10 items-center justify-center gap-2 rounded-xl bg-[#0b1511] px-3 text-sm font-semibold text-white transition hover:bg-[#102019] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] focus-visible:ring-offset-2 dark:bg-[#dfe7e3] dark:hover:bg-white" aria-label="Connect wallet">
          <WalletGlyph />
          <span className="hidden sm:inline">Connect wallet</span>
        </button>
      ) : (
        <>
          <div className="hidden sm:block"><WalletMultiButton /></div>
          <div className="wallet-icon-only sm:hidden" title={wallets.solanaAddress ? `Solana ${short(wallets.solanaAddress)}` : "Solana wallet"}>
            <WalletMultiButton><span className="sr-only">Solana wallet {short(wallets.solanaAddress)}</span></WalletMultiButton>
          </div>
          <div className="sui-wallet-compact">
            <ConnectButton>
              <span className="hidden sm:inline">Sui</span>
              <span className="sm:hidden" aria-hidden="true">S</span>
              <span className="sr-only sm:hidden">Sui wallet</span>
            </ConnectButton>
          </div>
        </>
      )}
      <WalletConnectModal open={open} onClose={closeModal} />
    </div>
  );
}
