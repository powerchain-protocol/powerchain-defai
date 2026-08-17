"use client";

import { DAppKitProvider } from "@mysten/dapp-kit-react";
import { ConnectButton } from "@mysten/dapp-kit-react/ui";
import { suiDAppKit } from "@/lib/wallet/sui-dapp-kit";

export function SuiConnectButton({ compact = false }: { compact?: boolean }) {
  return (
    <DAppKitProvider dAppKit={suiDAppKit}>
      <ConnectButton>
        {compact ? (
          <><span aria-hidden="true">S</span><span className="sr-only">Sui wallet</span></>
        ) : <span>Connect Sui wallet</span>}
      </ConnectButton>
    </DAppKitProvider>
  );
}
