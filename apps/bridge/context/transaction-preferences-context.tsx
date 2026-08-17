"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useUserSettings } from "@/context/user-settings-context";
import type { SwapChain } from "@/types/user-settings";

type Preferences = Readonly<{
  defaultSwapChain: SwapChain;
  setDefaultSwapChain: (chain: SwapChain) => void;
  showAdvancedRouting: boolean;
  setShowAdvancedRouting: (value: boolean) => void;
}>;

const Context = createContext<Preferences | null>(null);

export function TransactionPreferencesProvider({ children }: { children: ReactNode }) {
  const { settings, updateSettings } = useUserSettings();
  const value = useMemo<Preferences>(() => ({
    defaultSwapChain: settings.swap.defaultChain,
    setDefaultSwapChain: (chain) => updateSettings({ swap: { ...settings.swap, defaultChain: chain } }),
    showAdvancedRouting: settings.swap.showAdvancedRouting,
    setShowAdvancedRouting: (enabled) => updateSettings({ swap: { ...settings.swap, showAdvancedRouting: enabled } }),
  }), [settings.swap, updateSettings]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useTransactionPreferences() {
  const value = useContext(Context);
  if (!value) throw new Error("TRANSACTION_PREFERENCES_PROVIDER_REQUIRED");
  return value;
}
