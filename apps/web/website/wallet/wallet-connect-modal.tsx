"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import type { ClusterId } from "@powerchain/clusters";
import { CheckCircledIcon, Cross2Icon, ExternalLinkIcon } from "@radix-ui/react-icons";
import { NetworkIcon } from "@web3icons/react/dynamic";
import { buildAppHandoffUrl } from "@/website/lib/redirects";
import { useWebsiteWallet } from "@/website/providers/wallet-provider";

const SuiWalletConnector = dynamic(
  () => import("./sui-wallet-connector").then((module) => module.SuiWalletConnector),
  { ssr: false, loading: () => <button className="web-wallet-row" disabled>Loading Sui wallets…</button> },
);

const FOCUSABLE = 'button:not([disabled]), [href], select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function shortAddress(value: string) {
  return `${value.slice(0, 5)}…${value.slice(-4)}`;
}

function isUserRejectedWalletError(error: unknown) {
  const candidate = error as { name?: string; message?: string } | null;
  const text = `${candidate?.name ?? ""} ${candidate?.message ?? ""}`.toLowerCase();
  return text.includes("user rejected") || text.includes("user reject") || text.includes("rejected the request") || text.includes("request rejected");
}

type SolanaWallet = ReturnType<typeof useWallet>["wallets"][number];

export function WalletConnectModal({ open, onClose, targetSlug = "dashboard", resourceId }: { open: boolean; onClose: () => void; targetSlug?: string; resourceId?: string | null }) {
  const { wallets, connected, publicKey, disconnect, select } = useWallet();
  const { chain, clusterId, clusters, setChain, setClusterId, suiAddress, suiWalletName } = useWebsiteWallet();
  const [busyWallet, setBusyWallet] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  const chainClusters = useMemo(() => clusters.filter((cluster) => cluster.chain === chain), [chain, clusters]);
  const activeAddress = chain === "SOLANA" ? publicKey?.toBase58() ?? null : suiAddress;

  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
      if (event.key !== "Tab" || !panelRef.current) return;
      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      const first = nodes[0]; const last = nodes[nodes.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  async function connectSolana(wallet: SolanaWallet) {
    setError(null);
    setNotice(null);
    setBusyWallet(wallet.adapter.name);
    try {
      select(wallet.adapter.name);
      await wallet.adapter.connect();
    } catch (cause) {
      if (isUserRejectedWalletError(cause)) {
        setNotice("Connection cancelled. No wallet permissions were changed.");
      } else {
        setError("Wallet connection could not be completed. Check the wallet extension and try again.");
      }
    } finally {
      setBusyWallet(null);
    }
  }

  const dashboardUrl = buildAppHandoffUrl({ slug: targetSlug, id: resourceId, chain, clusterId });

  return (
    <div className="web-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={panelRef} className="web-wallet-modal" role="dialog" aria-modal="true" aria-labelledby="web-wallet-title">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="web-eyebrow">Wallet access</p>
            <h2 id="web-wallet-title" className="web-display mt-1 text-xl font-semibold tracking-tight text-brand-950 dark:text-brand-100">Connect to PowerChain</h2>
            <p className="mt-1 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">Choose a network and wallet. The website never receives a private key or signs transactions for you.</p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} className="web-icon-button" aria-label="Close wallet connection"><Cross2Icon /></button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-[#edf1ef] p-1 dark:bg-white/[.06]" role="tablist" aria-label="Blockchain network">
          {(["SOLANA", "SUI"] as const).map((candidate) => (
            <button key={candidate} type="button" role="tab" aria-selected={chain === candidate} onClick={() => setChain(candidate)} className={`web-chain-tab ${chain === candidate ? "web-chain-tab-active" : ""}`}>
              <NetworkIcon network={candidate === "SOLANA" ? "solana" : "sui"} variant="branded" size={20} />
              {candidate === "SOLANA" ? "Solana" : "Sui"}
            </button>
          ))}
        </div>

        <label className="mt-4 block">
          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[.14em] text-slate-500">Cluster</span>
          <select value={clusterId} onChange={(event) => setClusterId(event.target.value as ClusterId)} className="web-select">
            {chainClusters.map((cluster) => <option key={cluster.id} value={cluster.id}>{cluster.network} {cluster.production ? "· Production" : "· Development"}</option>)}
          </select>
        </label>

        <div className="mt-5">
          {chain === "SOLANA" ? (
            connected && publicKey ? (
              <div className="web-connected-wallet">
                <span className="grid size-10 place-items-center rounded-xl bg-white shadow-sm dark:bg-white/10"><NetworkIcon network="solana" variant="branded" size={24} /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">Solana connected</span><span className="block truncate text-xs text-slate-500">{shortAddress(publicKey.toBase58())}</span></span>
                <button type="button" className="web-text-button" onClick={() => void disconnect()}>Disconnect</button>
              </div>
            ) : (
              <div className="grid gap-2">
                {wallets.length ? wallets.map((wallet) => (
                  <button key={wallet.adapter.name} type="button" className="web-wallet-row" disabled={busyWallet !== null} onClick={() => void connectSolana(wallet)}>
                    {wallet.adapter.icon ? <img src={wallet.adapter.icon} alt="" width={30} height={30} className="size-8 rounded-lg" /> : <NetworkIcon network="solana" variant="branded" size={28} />}
                    <span className="min-w-0 flex-1 text-left"><span className="block text-sm font-semibold">{wallet.adapter.name}</span><span className="block text-xs text-slate-500">{wallet.readyState === "Installed" ? "Detected in this browser" : wallet.readyState}</span></span>
                    <span className="text-xs font-semibold text-[#294a3b] dark:text-[#a9c2b5]">{busyWallet === wallet.adapter.name ? "Connecting…" : "Connect"}</span>
                  </button>
                )) : <div className="web-empty-wallet">No Wallet Standard Solana wallet was detected in this browser.</div>}
              </div>
            )
          ) : (
            <div className="web-sui-connect-shell">
              {suiAddress ? <div className="mb-3 flex items-center gap-2 text-sm text-[#173b2d] dark:text-[#b7d1c4]"><CheckCircledIcon /> {suiWalletName ?? "Sui wallet"} · {shortAddress(suiAddress)}</div> : null}
              <SuiWalletConnector />
            </div>
          )}
        </div>

        {notice ? <p className="mt-3 rounded-xl border border-[#cddbd4] bg-[#f1f6f3] px-3 py-2 text-xs text-[#365746] dark:border-white/10 dark:bg-white/[.045] dark:text-[#bfd1c8]">{notice}</p> : null}
        {error ? <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">{error}</p> : null}

        <div className="mt-5 border-t border-slate-200 pt-4 dark:border-white/10">
          <a href={dashboardUrl} className="web-button web-button-primary w-full gap-2" onClick={onClose}>
            {activeAddress ? "Continue to workspace" : "Open workspace without connecting"}<ExternalLinkIcon />
          </a>
          <p className="mt-3 text-center text-[11px] leading-5 text-slate-500">Wallet connection is optional on the marketing site. Signing and transaction approval remain inside your wallet in the application.</p>
        </div>
      </div>
    </div>
  );
}
