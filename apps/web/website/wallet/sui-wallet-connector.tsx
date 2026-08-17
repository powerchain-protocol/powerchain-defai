"use client";

import { useEffect } from "react";
import { DAppKitProvider, useCurrentAccount, useCurrentWallet } from "@mysten/dapp-kit-react";
import { ConnectButton } from "@mysten/dapp-kit-react/ui";
import { websiteSuiDAppKit } from "@/website/lib/sui-dapp-kit";
import { useWebsiteWallet } from "@/website/providers/wallet-provider";

function SnapshotBridge() {
  const account = useCurrentAccount();
  const wallet = useCurrentWallet();
  const { setSuiSnapshot } = useWebsiteWallet();
  useEffect(() => {
    setSuiSnapshot(account?.address ?? null, wallet?.name ?? null);
    return () => setSuiSnapshot(null, null);
  }, [account?.address, wallet?.name, setSuiSnapshot]);
  return null;
}

export function SuiWalletConnector() {
  return (
    <DAppKitProvider dAppKit={websiteSuiDAppKit}>
      <SnapshotBridge />
      <div className="web-wallet-provider-button"><ConnectButton /></div>
    </DAppKitProvider>
  );
}
