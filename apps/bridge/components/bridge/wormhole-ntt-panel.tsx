"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { config } from "@wormhole-foundation/wormhole-connect";
import { readPowerChainConnectConfig } from "@/lib/wormhole/connect-config";

const WormholeConnect = dynamic(() => import("@wormhole-foundation/wormhole-connect"), { ssr: false });

export function WormholeNttPanel() {
  const result = useMemo(() => {
    try { return { config: readPowerChainConnectConfig(), error: null as string | null }; }
    catch (e) { return { config: null, error: e instanceof Error ? e.message : "INVALID_WORMHOLE_CONFIG" }; }
  }, []);
  if (result.error) return <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-900"><h2 className="font-semibold">NTT configuration invalid</h2><p className="mt-1">{result.error}</p></section>;
  if (!result.config) return <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950"><h2 className="font-semibold">Wormhole NTT deployment required</h2><p className="mt-1">Set <code>NEXT_PUBLIC_POWERCHAIN_NTT_CONNECT_CONFIG_JSON</code> with the deployed Solana/Sui PWRC NTT managers, tokens and transceivers. No deployment address is invented by this application.</p></section>;
  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-950"><WormholeConnect config={result.config as config.WormholeConnectConfig} /></section>;
}
