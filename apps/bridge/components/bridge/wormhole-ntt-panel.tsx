"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useMemo } from "react";
import type { config } from "@wormhole-foundation/wormhole-connect";
import { readPowerChainConnectConfig } from "@/lib/wormhole/connect-config";

function ConnectLoadingState() {
  return (
    <div className="space-y-3 p-3" role="status" aria-live="polite" aria-label="Loading bridge transfer interface">
      <div className="h-14 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900" />
      <div className="h-28 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900" />
      <div className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-900" />
      <span className="sr-only">Loading Wormhole NTT transfer interface…</span>
    </div>
  );
}

const WormholeConnect = dynamic(() => import("@wormhole-foundation/wormhole-connect"), {
  ssr: false,
  loading: ConnectLoadingState,
});

export function WormholeNttPanel() {
  const result = useMemo(() => {
    try {
      return { config: readPowerChainConnectConfig(), error: null as string | null };
    } catch (error) {
      return { config: null, error: error instanceof Error ? error.message : "INVALID_WORMHOLE_CONFIG" };
    }
  }, []);

  return (
    <section className="pc-cinematic-panel pc-subtle-shine overflow-hidden rounded-[28px]" aria-labelledby="ntt-transfer-title">
      <div className="border-b border-white/10 px-4 py-4 text-white sm:px-5 sm:py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d0dcd6]">Transfer</p>
            <h2 id="ntt-transfer-title" className="mt-1 text-xl font-semibold tracking-tight">Bridge wPWRC → PWRC</h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-300">Wallet-signed Wormhole NTT settlement from Sui to Solana. Reverse routing remains available when supported by the configured deployment.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-[#c4d0ca]/25 bg-[#c7d4ce]/10 px-2.5 py-1 text-[11px] font-semibold text-[#e0e8e4]">Default · Sui → Solana</span>
            <span className="rounded-full border border-white/15 bg-white/[0.05] px-2.5 py-1 text-[11px] font-semibold text-slate-200">1:1 principal</span>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Image src="/tokens/wpwrc.png" alt="" width={42} height={42} className="size-10 shrink-0 rounded-full object-cover" />
            <div className="min-w-0"><p className="text-[10px] uppercase tracking-wide text-slate-400">You send · Sui</p><p className="truncate text-sm font-semibold">wPWRC</p></div>
          </div>
          <span className="grid size-9 place-items-center rounded-full border border-[#c4d0ca]/25 bg-[#c7d4ce]/10 text-[#e0e8e4]" aria-hidden="true">→</span>
          <div className="flex min-w-0 items-center justify-end gap-2.5 text-right">
            <div className="min-w-0"><p className="text-[10px] uppercase tracking-wide text-slate-400">You receive · Solana</p><p className="truncate text-sm font-semibold">PWRC</p></div>
            <Image src="/tokens/pwrc.png" alt="" width={42} height={42} className="size-10 shrink-0 rounded-full object-cover" />
          </div>
        </div>
      </div>
      <div className="relative z-10 bg-white/92 p-2 backdrop-blur-xl sm:p-3 dark:bg-[#050807]/88">
        {result.error ? (
          <div className="m-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-100" role="alert">
            <h3 className="font-semibold">NTT configuration invalid</h3>
            <p className="mt-1 break-words text-xs leading-5">{result.error}</p>
          </div>
        ) : !result.config ? (
          <div className="m-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-100" role="status">
            <h3 className="font-semibold">Wormhole NTT deployment required</h3>
            <p className="mt-1 text-xs leading-5">Set <code>NEXT_PUBLIC_POWERCHAIN_NTT_CONNECT_CONFIG_JSON</code> with the deployed Solana/Sui PWRC NTT managers, tokens and transceivers. No deployment address is invented by this application.</p>
          </div>
        ) : (
          <div className="min-h-[420px] overflow-hidden rounded-[18px] border border-slate-100 dark:border-slate-800">
            <WormholeConnect config={result.config as config.WormholeConnectConfig} />
          </div>
        )}
      </div>
    </section>
  );
}
