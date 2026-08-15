"use client";

import dynamic from "next/dynamic";
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
    <section className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950" aria-labelledby="ntt-transfer-title">
      <div className="border-b border-slate-100 px-4 py-4 dark:border-slate-800 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">Transfer</p>
            <h2 id="ntt-transfer-title" className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">Wormhole NTT bridge</h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500 dark:text-slate-400">Choose the source chain, destination chain and amount. Your wallet remains responsible for signing each required transaction.</p>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">1:1 principal</span>
        </div>
      </div>
      {result.error ? (
        <div className="m-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-100" role="alert">
          <h3 className="font-semibold">NTT configuration invalid</h3>
          <p className="mt-1 break-words text-xs leading-5">{result.error}</p>
        </div>
      ) : !result.config ? (
        <div className="m-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-100" role="status">
          <h3 className="font-semibold">Wormhole NTT deployment required</h3>
          <p className="mt-1 text-xs leading-5">Set <code>NEXT_PUBLIC_POWERCHAIN_NTT_CONNECT_CONFIG_JSON</code> with the deployed Solana/Sui PWRC NTT managers, tokens and transceivers. No deployment address is invented by this application.</p>
        </div>
      ) : (
        <div className="min-h-[420px] p-2 sm:p-3">
          <WormholeConnect config={result.config as config.WormholeConnectConfig} />
        </div>
      )}
    </section>
  );
}
