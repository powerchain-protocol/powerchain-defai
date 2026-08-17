"use client";

import { useEffect, useState } from "react";
import { NetworkIcon } from "@web3icons/react/dynamic";
import { SolanaSwapInterface } from "./solana-swap-interface";
import { SuiSwapIsland } from "./sui-swap-island";
import { useTransactionPreferences } from "@/context/transaction-preferences-context";
import { Tabs } from "@/components/ui/tabs";

const CHAIN_TABS = [
  { value: "SOLANA" as const, label: "Solana", icon: <NetworkIcon network="solana" size={20} variant="branded" /> },
  { value: "SUI" as const, label: "Sui", icon: <NetworkIcon network="sui" size={20} variant="branded" /> },
] as const;

export function MultichainSwapInterface() {
  const prefs = useTransactionPreferences();
  const [chain, setChain] = useState<"SOLANA" | "SUI">(prefs.defaultSwapChain);

  useEffect(() => setChain(prefs.defaultSwapChain), [prefs.defaultSwapChain]);

  return (
    <div className="space-y-3">
      <div className="max-w-sm">
        <Tabs value={chain} onValueChange={setChain} items={CHAIN_TABS} label="Swap network" />
      </div>
      {chain === "SOLANA" ? <SolanaSwapInterface /> : <SuiSwapIsland />}
    </div>
  );
}
