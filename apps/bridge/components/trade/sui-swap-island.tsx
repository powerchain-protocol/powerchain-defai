"use client";

import { DAppKitProvider } from "@mysten/dapp-kit-react";
import { suiDAppKit } from "@/lib/wallet/sui-dapp-kit";
import { SwapInterface } from "./swap-interface";

export function SuiSwapIsland() {
  return (
    <DAppKitProvider dAppKit={suiDAppKit}>
      <SwapInterface />
    </DAppKitProvider>
  );
}
