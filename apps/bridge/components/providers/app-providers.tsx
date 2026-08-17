"use client";

import type { ReactNode } from "react";
import { PowerChainWalletProvider } from "../wallet/wallet-provider";
import { ToastViewport } from "../ui/toast";
import { ThemeProvider } from "./theme-provider";
import { TransactionPreferencesProvider } from "@/context/transaction-preferences-context";
import { ProviderRuntimeProvider } from "@/context/provider-runtime-context";
import { SuiWalletStateProvider } from "@/context/sui-wallet-context";
import { UserSettingsProvider } from "@/context/user-settings-context";
import { CookieNotice } from "@/components/legal/cookies";
import { ErrorBoundary } from "@/components/errors/error-boundary";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <UserSettingsProvider>
        <TransactionPreferencesProvider>
          <SuiWalletStateProvider>
            <PowerChainWalletProvider>
              <ProviderRuntimeProvider>
                <ErrorBoundary name="PowerChain DeFAI workspace">{children}</ErrorBoundary>
                <CookieNotice />
                <ToastViewport />
              </ProviderRuntimeProvider>
            </PowerChainWalletProvider>
          </SuiWalletStateProvider>
        </TransactionPreferencesProvider>
      </UserSettingsProvider>
    </ThemeProvider>
  );
}
