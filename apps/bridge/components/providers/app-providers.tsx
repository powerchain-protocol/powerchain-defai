"use client";

import type { ReactNode } from "react";
import { PowerChainWalletProvider } from "../wallet/wallet-provider";
import { ToastViewport } from "../ui/toast";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <PowerChainWalletProvider>
      {children}
      <ToastViewport />
    </PowerChainWalletProvider>
  );
}
