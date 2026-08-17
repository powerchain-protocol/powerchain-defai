"use client";

import dynamic from "next/dynamic";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type SuiWalletSnapshot = Readonly<{
  address: string | null;
  walletName: string | null;
}>;

type SuiWalletContextValue = Readonly<{
  snapshot: SuiWalletSnapshot;
  setSnapshot: (snapshot: SuiWalletSnapshot) => void;
}>;

const DEFAULT_SNAPSHOT: SuiWalletSnapshot = Object.freeze({ address: null, walletName: null });
const SuiWalletContext = createContext<SuiWalletContextValue | null>(null);

const SuiWalletRuntime = dynamic(
  () => import("@/components/wallet/sui-wallet-runtime").then((module) => module.SuiWalletRuntime),
  { ssr: false },
);

export function SuiWalletStateProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<SuiWalletSnapshot>(DEFAULT_SNAPSHOT);
  const value = useMemo(() => ({ snapshot, setSnapshot }), [snapshot]);
  return (
    <SuiWalletContext.Provider value={value}>
      <SuiWalletRuntime />
      {children}
    </SuiWalletContext.Provider>
  );
}

function useSuiWalletContext() {
  const value = useContext(SuiWalletContext);
  if (!value) throw new Error("SUI_WALLET_CONTEXT_REQUIRED");
  return value;
}

export function useSuiWalletSnapshot() {
  return useSuiWalletContext().snapshot;
}

export function useSetSuiWalletSnapshot() {
  return useSuiWalletContext().setSnapshot;
}
