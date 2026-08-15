"use client";

import { useEffect, useRef } from "react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { ConnectButton } from "@mysten/dapp-kit-react/ui";

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function WalletConnectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { setVisible } = useWalletModal();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = originalOverflow;
      previousFocus.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 supports-[backdrop-filter]:backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <div ref={dialogRef} className="w-full max-w-md rounded-[20px] border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-950 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="wallet-connect-title" aria-describedby="wallet-connect-description">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">Wallet</p>
            <h2 id="wallet-connect-title" className="mt-1 text-lg font-semibold">Connect wallet</h2>
            <p id="wallet-connect-description" className="mt-1 text-sm leading-5 text-slate-500">Choose the chain you want to use. Private keys and signatures stay in your wallet.</p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} className="inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-lg text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-slate-900 dark:hover:text-white" aria-label="Close wallet dialog">×</button>
        </div>
        <div className="mt-5 grid gap-3">
          <button type="button" className="min-h-14 rounded-xl border border-slate-200 px-4 text-left transition hover:border-blue-300 hover:bg-blue-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:hover:border-blue-800 dark:hover:bg-blue-950/20" onClick={() => { setVisible(true); onClose(); }}>
            <span className="block text-sm font-semibold">Solana wallet</span>
            <span className="mt-0.5 block text-xs text-slate-500">Phantom, Solflare, Backpack and Wallet Standard providers</span>
          </button>
          <div className="rounded-xl border border-slate-200 p-2 transition hover:border-blue-300 dark:border-slate-800 dark:hover:border-blue-800">
            <ConnectButton><span>Connect Sui wallet</span></ConnectButton>
            <p className="px-2 pb-1 pt-2 text-xs text-slate-500">Connect through Mysten dApp Kit compatible wallets.</p>
          </div>
        </div>
        <p className="mt-4 border-t border-slate-100 pt-4 text-[11px] leading-5 text-slate-500 dark:border-slate-800">Only approve transactions you understand. PowerChain never asks for a seed phrase or private key.</p>
      </div>
    </div>
  );
}
