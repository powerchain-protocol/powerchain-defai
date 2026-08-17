"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ConnectionProvider, WalletProvider, useWallet } from "@solana/wallet-adapter-react";
import type { WalletError } from "@solana/wallet-adapter-base";
import type { ClusterDefinition, ClusterId } from "@powerchain/clusters";
import { POWERCHAIN_CLUSTERS } from "@powerchain/clusters";
import type { HandoffChain } from "@/website/lib/redirects";

const SOLANA_RPC: Partial<Record<ClusterId, string>> = {
  "solana:mainnet": process.env.NEXT_PUBLIC_SOLANA_WALLET_RPC_URL?.trim() || "https://api.mainnet-beta.solana.com",
  "solana:testnet": process.env.NEXT_PUBLIC_SOLANA_TESTNET_RPC_URL?.trim() || "https://api.testnet.solana.com",
  "solana:devnet": process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC_URL?.trim() || "https://api.devnet.solana.com",
  "solana:localnet": "http://127.0.0.1:8899",
};

const DEFAULT_CLUSTER: Record<HandoffChain, ClusterId> = {
  SOLANA: "solana:mainnet",
  SUI: "sui:mainnet",
};

type WalletSession = Readonly<{
  chain: HandoffChain;
  clusterId: ClusterId;
  clusters: readonly ClusterDefinition[];
  solanaAddress: string | null;
  suiAddress: string | null;
  suiWalletName: string | null;
  setChain: (chain: HandoffChain) => void;
  setClusterId: (clusterId: ClusterId) => void;
  setSuiSnapshot: (address: string | null, walletName: string | null) => void;
}>;

const WalletSessionContext = createContext<WalletSession | null>(null);

function SolanaSnapshotBridge({ setAddress }: { setAddress: (address: string | null) => void }) {
  const { publicKey } = useWallet();
  useEffect(() => setAddress(publicKey?.toBase58() ?? null), [publicKey, setAddress]);
  return null;
}

function isUserRejectedWalletError(error: unknown) {
  const candidate = error as { name?: string; message?: string } | null;
  const text = `${candidate?.name ?? ""} ${candidate?.message ?? ""}`.toLowerCase();
  return text.includes("user rejected") || text.includes("user reject") || text.includes("rejected the request") || text.includes("request rejected");
}

function handleSolanaWalletError(error: WalletError) {
  if (isUserRejectedWalletError(error)) return;
  if (process.env.NODE_ENV !== "production") console.warn(`[PowerChain wallet] ${error.name || "WalletError"}`);
}

function SolanaRuntime({ clusterId, setAddress, children }: { clusterId: ClusterId; setAddress: (address: string | null) => void; children: ReactNode }) {
  const endpoint = useMemo(() => {
    if (!clusterId.startsWith("solana:")) return SOLANA_RPC["solana:mainnet"]!;
    if (clusterId === "solana:localnet" && process.env.NODE_ENV === "production") return SOLANA_RPC["solana:mainnet"]!;
    return SOLANA_RPC[clusterId] ?? SOLANA_RPC["solana:mainnet"]!;
  }, [clusterId]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect={false} localStorageKey="powerchain-web-solana-wallet" onError={handleSolanaWalletError}>
        <SolanaSnapshotBridge setAddress={setAddress} />
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
}

export function WebsiteWalletProvider({ children }: { children: ReactNode }) {
  const [chain, setChainState] = useState<HandoffChain>("SOLANA");
  const [clusterId, setClusterIdState] = useState<ClusterId>(DEFAULT_CLUSTER.SOLANA);
  const [solanaAddress, setSolanaAddress] = useState<string | null>(null);
  const [suiAddress, setSuiAddress] = useState<string | null>(null);
  const [suiWalletName, setSuiWalletName] = useState<string | null>(null);

  useEffect(() => {
    const savedChain = window.localStorage.getItem("powerchain-web-chain");
    const savedCluster = window.localStorage.getItem("powerchain-web-cluster");
    const cluster = POWERCHAIN_CLUSTERS.find((candidate) => candidate.id === savedCluster);
    if (cluster) {
      setChainState(cluster.chain);
      setClusterIdState(cluster.id);
      return;
    }
    if (savedChain === "SOLANA" || savedChain === "SUI") {
      setChainState(savedChain);
      setClusterIdState(DEFAULT_CLUSTER[savedChain]);
    }
  }, []);

  function setChain(next: HandoffChain) {
    setChainState(next);
    const preferred = clusterId.startsWith(next === "SOLANA" ? "solana:" : "sui:") ? clusterId : DEFAULT_CLUSTER[next];
    setClusterIdState(preferred);
    window.localStorage.setItem("powerchain-web-chain", next);
    window.localStorage.setItem("powerchain-web-cluster", preferred);
  }

  function setClusterId(next: ClusterId) {
    const cluster = POWERCHAIN_CLUSTERS.find((candidate) => candidate.id === next);
    if (!cluster) return;
    const nextChain: HandoffChain = cluster.chain;
    setChainState(nextChain);
    setClusterIdState(next);
    window.localStorage.setItem("powerchain-web-chain", nextChain);
    window.localStorage.setItem("powerchain-web-cluster", next);
  }

  const setSuiSnapshot = useCallback((address: string | null, walletName: string | null) => {
    setSuiAddress(address);
    setSuiWalletName(walletName);
  }, []);

  const value = useMemo<WalletSession>(() => ({
    chain,
    clusterId,
    clusters: POWERCHAIN_CLUSTERS,
    solanaAddress,
    suiAddress,
    suiWalletName,
    setChain,
    setClusterId,
    setSuiSnapshot,
  }), [chain, clusterId, solanaAddress, suiAddress, suiWalletName, setSuiSnapshot]);

  return (
    <WalletSessionContext.Provider value={value}>
      <SolanaRuntime clusterId={clusterId} setAddress={setSolanaAddress}>{children}</SolanaRuntime>
    </WalletSessionContext.Provider>
  );
}

export function useWebsiteWallet() {
  const value = useContext(WalletSessionContext);
  if (!value) throw new Error("WEBSITE_WALLET_PROVIDER_REQUIRED");
  return value;
}
