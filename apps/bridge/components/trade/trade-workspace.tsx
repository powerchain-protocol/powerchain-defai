"use client";

import { useState } from "react";
import { WormholeNttPanel } from "@/components/bridge/wormhole-ntt-panel";
import { MultichainSwapInterface } from "./multichain-swap-interface";
import { TransactionFeeSummary } from "./transaction-fee-summary";
import { TradeInformation } from "./information";
import { TradeSettings } from "./settings";

type TradeTab = "swap" | "bridge";

function ModeIcon({ mode }: { mode: TradeTab }) {
  return mode === "swap" ? (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M7 7h11m0 0-3-3m3 3-3 3M17 17H6m0 0 3 3m-3-3 3-3" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M8 7h8a3 3 0 0 1 3 3v1M16 17H8a3 3 0 0 1-3-3v-1" />
      <path d="m16 4 3 3-3 3M8 20l-3-3 3-3" />
    </svg>
  );
}

const MODE_COPY: Record<TradeTab, { eyebrow: string; detail: string; chips: readonly string[] }> = {
  swap: {
    eyebrow: "Multichain liquidity",
    detail: "Solana routing through Jupiter and trusted DEX liquidity, or a Cetus-routed swap on Sui, with wallet-owned signatures.",
    chips: ["Solana + Sui", "User pays gas", "Trusted assets"],
  },
  bridge: {
    eyebrow: "Cross-chain settlement",
    detail: "Wormhole NTT principal movement with wallet signatures and persisted finality checks.",
    chips: ["1:1 principal", "Wormhole NTT", "Finality verified"],
  },
};

export function TradeWorkspace({ defaultTab = "bridge" }: { defaultTab?: TradeTab }) {
  const [tab, setTab] = useState<TradeTab>(defaultTab);
  const copy = MODE_COPY[tab];

  return (
    <section aria-label="Swap and bridge workspace" className="min-w-0">
      <div className="pc-glass mb-4 rounded-[22px] p-2 sm:p-2.5">
        <div className="grid grid-cols-2 gap-1.5" role="tablist" aria-label="Transaction type">
          {(["swap", "bridge"] as const).map((item) => {
            const selected = tab === item;
            return (
              <button
                key={item}
                type="button"
                role="tab"
                id={`trade-tab-${item}`}
                aria-controls={`trade-panel-${item}`}
                aria-selected={selected}
                onClick={() => setTab(item)}
                className={`group flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold capitalize transition-all duration-200 ${selected ? "pc-button-light text-slate-950 dark:text-white" : "text-slate-500 hover:bg-white/65 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/[0.05] dark:hover:text-white"}`}
              >
                <span className={`grid size-7 place-items-center rounded-xl border transition ${selected ? "border-slate-200 bg-white/80 text-[#173b2d] dark:border-white/10 dark:bg-white/[0.06] dark:text-white" : "border-transparent bg-slate-100/70 text-slate-500 group-hover:text-slate-800 dark:bg-white/[0.04] dark:text-slate-400 dark:group-hover:text-white"}`}>
                  <ModeIcon mode={item} />
                </span>
                {item}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-2 px-2 pb-1 pt-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.17em] text-[#557568] dark:text-[#b9c8c1]">{copy.eyebrow}</p>
            <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500 dark:text-slate-400">{copy.detail}</p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5" aria-label={`${tab} safeguards`}>
            <TradeSettings />
            {copy.chips.map((chip) => (
              <span key={chip} className="rounded-full border border-slate-200 bg-white/72 px-2.5 py-1 text-[10px] font-semibold text-slate-600 dark:border-white/8 dark:bg-white/[0.035] dark:text-slate-300">
                {chip}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div
        id={`trade-panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`trade-tab-${tab}`}
        className="animate-[trade-reveal_220ms_ease-out]"
      >
        {tab === "swap" ? <MultichainSwapInterface /> : <WormholeNttPanel />}
      </div>
      <TransactionFeeSummary mode={tab} />
      <TradeInformation mode={tab} />
    </section>
  );
}
