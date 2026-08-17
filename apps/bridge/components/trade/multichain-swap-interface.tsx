"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { SolanaSwapInterface } from "./solana-swap-interface";
import { useTransactionPreferences } from "@/context/transaction-preferences-context";

const SuiSwapIsland = dynamic(
  () => import("./sui-swap-island").then((module) => module.SuiSwapIsland),
  { ssr: false, loading: () => <div className="pc-glass rounded-2xl p-5 text-sm text-slate-500">Loading Sui wallet runtime…</div> },
);

export function MultichainSwapInterface() {
  const prefs = useTransactionPreferences();
  const [chain, setChain] = useState<"SOLANA" | "SUI">(prefs.defaultSwapChain);
  useEffect(() => setChain(prefs.defaultSwapChain), [prefs.defaultSwapChain]);
  return (
    <div>
      <div className="pc-glass mb-3 inline-flex rounded-2xl p-1" role="tablist" aria-label="Swap network">
        <button role="tab" aria-selected={chain === "SOLANA"} onClick={() => setChain("SOLANA")} className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${chain === "SOLANA" ? "bg-slate-950 text-white shadow-sm dark:bg-white dark:text-black" : "text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"}`}>Solana</button>
        <button role="tab" aria-selected={chain === "SUI"} onClick={() => setChain("SUI")} className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${chain === "SUI" ? "bg-slate-950 text-white shadow-sm dark:bg-white dark:text-black" : "text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"}`}>Sui</button>
      </div>
      {chain === "SOLANA" ? <SolanaSwapInterface /> : <SuiSwapIsland />}
    </div>
  );
}
