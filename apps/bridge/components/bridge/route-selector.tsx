"use client";

import { NetworkIcon } from "@web3icons/react/dynamic";
import { CryptoAssetIcon } from "@/components/assets/crypto-asset-icon";
import { BridgeIcon } from "@/components/icons/bridge-icon";
import { SwapIcon } from "@/components/icons/swap-icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type BridgeNetwork = "SOLANA" | "SUI";
type Route = { source: BridgeNetwork; destination: BridgeNetwork };

const LABELS = {
  SOLANA: { name: "Solana", asset: "PWRC", detail: "Token-2022 · mainnet-beta" },
  SUI: { name: "Sui", asset: "wPWRC", detail: "1:1 bridged representation · mainnet" },
} as const;

export function RouteSelector({ source, destination, disabled = false, onChange }: Route & { disabled?: boolean; onChange: (route: Route) => void }) {
  const swap = () => onChange({ source: destination, destination: source });
  return (
    <Card className="p-4" aria-labelledby="route-selector-title">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="pc-icon-surface size-10"><BridgeIcon className="size-5" /></span>
          <div>
            <h2 id="route-selector-title" className="text-sm font-semibold text-slate-950 dark:text-white">Bridge route</h2>
            <p className="mt-0.5 text-[11px] text-slate-500">Wallet-signed Wormhole NTT transfer</p>
          </div>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-500 dark:border-white/8 dark:bg-white/[.04]">1:1 principal</span>
      </div>
      <div className="mt-4 grid items-stretch gap-2 sm:grid-cols-[1fr_auto_1fr]">
        <NetworkButton label="From" network={source} disabled={disabled} onClick={swap} />
        <Button
          variant="secondary"
          size="icon"
          onClick={swap}
          disabled={disabled}
          aria-label="Reverse bridge direction"
          className="mx-auto self-center shadow-[0_5px_16px_rgba(7,16,13,.07)] hover:-translate-y-px hover:shadow-[0_9px_24px_rgba(7,16,13,.11)] sm:my-auto"
        >
          <SwapIcon className="size-5" />
        </Button>
        <NetworkButton label="To" network={destination} disabled={disabled} onClick={swap} />
      </div>
    </Card>
  );
}

function NetworkButton({ label, network, disabled, onClick }: { label: string; network: BridgeNetwork; disabled: boolean; onClick: () => void }) {
  const item = LABELS[network];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex min-h-[78px] items-center gap-3 rounded-[var(--pc-radius-control)] border border-slate-200 bg-slate-50/75 px-3.5 text-left transition-all duration-200 hover:-translate-y-px hover:border-slate-300 hover:bg-white hover:shadow-[0_8px_22px_rgba(7,16,13,.07)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#557568] disabled:cursor-default disabled:opacity-60 disabled:hover:translate-y-0 dark:border-white/8 dark:bg-white/[.035] dark:hover:border-white/14 dark:hover:bg-white/[.055]"
    >
      <span className="relative grid size-10 shrink-0 place-items-center rounded-[var(--pc-radius-control)] bg-white shadow-sm ring-1 ring-slate-200/80 dark:bg-[#101a16] dark:ring-white/10">
        <NetworkIcon network={network === "SOLANA" ? "solana" : "sui"} size={25} variant="branded" />
        <span className="absolute -bottom-1 -right-1 rounded-full bg-white p-0.5 shadow-sm ring-1 ring-slate-200 dark:bg-[#0a100d] dark:ring-white/10"><CryptoAssetIcon token={{ symbol: item.asset }} size={16} /></span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</span>
        <span className="mt-0.5 block text-sm font-semibold text-slate-950 dark:text-white">{item.name} · {item.asset}</span>
        <span className="mt-0.5 block truncate text-[10px] text-slate-500 dark:text-slate-400">{item.detail}</span>
      </span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4 text-slate-300 transition group-hover:text-slate-500" aria-hidden="true"><path d="m8 10 4 4 4-4" /></svg>
    </button>
  );
}
