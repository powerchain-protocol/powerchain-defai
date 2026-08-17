"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { WalletAdapterNetwork, type WalletAdapter } from "@solana/wallet-adapter-base";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { useUserSettings } from "@/context/user-settings-context";
import { normalizeHttpEndpoint } from "@/lib/settings/storage";

function useOptionalWalletConnectAdapter() {
  const [wallets, setWallets] = useState<WalletAdapter[]>([]);
  useEffect(() => {
    const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID?.trim();
    if (!projectId || typeof window === "undefined") return;
    let active = true;
    void import("@walletconnect/solana-adapter")
      .then(({ WalletConnectWalletAdapter }) => {
        if (!active) return;
        setWallets([new WalletConnectWalletAdapter({ network: WalletAdapterNetwork.Mainnet, options: { projectId } })]);
      })
      .catch(() => { if (active) setWallets([]); });
    return () => { active = false; };
  }, []);
  return wallets;
}

export function PowerChainWalletProvider({ children }: { children: ReactNode }) {
  const { settings } = useUserSettings();
  const endpoint = useMemo(() => {
    if (settings.connectivity.useCustomSolanaRpc && settings.connectivity.solanaRpcUrl.trim()) {
      try { return normalizeHttpEndpoint(settings.connectivity.solanaRpcUrl, { allowLocalDevelopment: process.env.NODE_ENV !== "production" }); } catch { /* canonical fallback */ }
    }
    return process.env.NEXT_PUBLIC_SOLANA_WALLET_RPC_URL?.trim() || "https://api.mainnet-beta.solana.com";
  }, [settings.connectivity.solanaRpcUrl, settings.connectivity.useCustomSolanaRpc]);
  const walletConnectWallets = useOptionalWalletConnectAdapter();
  return (
    <ConnectionProvider endpoint={endpoint} key={endpoint}>
      <WalletProvider wallets={walletConnectWallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
