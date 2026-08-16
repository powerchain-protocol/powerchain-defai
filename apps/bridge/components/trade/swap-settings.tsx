"use client";

import { useEffect, useRef, useState } from "react";
import { MAX_SWAP_SLIPPAGE_BPS, MIN_SWAP_SLIPPAGE_BPS, SWAP_SLIPPAGE_PRESETS_BPS, formatSwapSlippagePercent } from "@powerchain/swap-core";

function GearIcon() {
  return <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.15.38.36.72.6 1 .29.32.67.52 1.1.6H21v4h-.09c-.43.08-.81.28-1.1.6-.24.28-.45.62-.6 1Z"/></svg>;
}

export function SwapSettings({ slippageBps, onSlippageChange, protection, onProtectionChange }: { slippageBps: number; onSlippageChange: (bps: number) => void; protection: boolean; onProtectionChange: (value: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    const outside = (event: PointerEvent) => { if (panelRef.current && !panelRef.current.contains(event.target as Node)) setOpen(false); };
    window.addEventListener("keydown", close);
    window.addEventListener("pointerdown", outside);
    return () => { window.removeEventListener("keydown", close); window.removeEventListener("pointerdown", outside); };
  }, [open]);
  return <div className="relative">
    <button type="button" onClick={() => setOpen((value) => !value)} className="pc-button-light grid size-10 place-items-center rounded-xl text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] dark:text-slate-300" aria-label="Swap settings" aria-expanded={open}><GearIcon /></button>
    {open ? <div ref={panelRef} className="pc-review-sheet absolute right-0 top-12 z-30 w-[min(330px,calc(100vw-2rem))] rounded-2xl p-4" role="dialog" aria-label="Swap settings">
      <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Swap settings</h3><button type="button" onClick={() => setOpen(false)} className="text-xs font-semibold text-slate-500">Close</button></div>
      <div className="mt-4"><p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Slippage tolerance</p><div className="mt-2 grid grid-cols-4 gap-2">{SWAP_SLIPPAGE_PRESETS_BPS.map((bps) => <button key={bps} type="button" onClick={() => onSlippageChange(bps)} className={`min-h-9 rounded-lg border text-xs font-semibold ${slippageBps === bps ? "border-[#8ea69a] bg-[#f1f4f2] text-[#214233] dark:bg-[#09110e]/60 dark:text-[#e0e8e4]" : "border-slate-200 dark:border-white/10"}`}>{formatSwapSlippagePercent(bps)}</button>)}<label className="relative"><span className="sr-only">Custom slippage percentage</span><input type="number" min={MIN_SWAP_SLIPPAGE_BPS/100} max={MAX_SWAP_SLIPPAGE_BPS/100} step="0.1" value={(slippageBps/100).toString()} onChange={(event) => onSlippageChange(Math.max(MIN_SWAP_SLIPPAGE_BPS, Math.min(MAX_SWAP_SLIPPAGE_BPS, Math.round(Number(event.target.value)*100))))} className="h-9 w-full rounded-lg border border-slate-200 bg-transparent px-2 text-xs outline-none focus:ring-2 focus:ring-[#35584a] dark:border-white/10"/></label></div><p className="mt-1.5 text-[11px] text-slate-500">Allowed range 0.01%–5%. Quotes enforce minimum received.</p></div>
      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 dark:border-white/10"><input type="checkbox" checked={protection} onChange={(event) => onProtectionChange(event.target.checked)} className="mt-0.5 size-4 accent-[#173b2d]"/><span><span className="block text-xs font-semibold">MEV-aware price protection</span><span className="mt-0.5 block text-[11px] leading-4 text-slate-500">Enforces fresh quotes and minimum received. This does not claim private order flow or a private relay.</span></span></label>
    </div> : null}
  </div>;
}
