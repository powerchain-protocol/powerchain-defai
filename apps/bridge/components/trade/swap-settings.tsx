"use client";

import { useEffect, useRef, useState } from "react";
import { MAX_SWAP_SLIPPAGE_BPS, MIN_SWAP_SLIPPAGE_BPS, SWAP_SLIPPAGE_PRESETS_BPS, formatSwapSlippagePercent } from "@powerchain/swap-core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function GearIcon() {
  return <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.15.38.36.72.6 1 .29.32.67.52 1.1.6H21v4h-.09c-.43.08-.81.28-1.1.6-.24.28-.45.62-.6 1Z"/></svg>;
}

export function SwapSettings({ slippageBps, onSlippageChange, protection, onProtectionChange }: { slippageBps: number; onSlippageChange: (bps: number) => void; protection: boolean; onProtectionChange: (value: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = (restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) queueMicrotask(() => triggerRef.current?.focus());
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close(true);
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) close(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <Button ref={triggerRef} variant="secondary" size="icon" onClick={() => setOpen((value) => !value)} aria-label="Swap settings" aria-expanded={open} aria-controls="swap-settings-panel"><GearIcon /></Button>
      {open ? (
        <div id="swap-settings-panel" className="pc-review-sheet absolute right-0 top-12 z-30 w-[min(330px,calc(100vw-2rem))] rounded-[var(--pc-radius-card)] p-4" role="dialog" aria-label="Swap settings">
          <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold">Swap settings</h3><Button variant="ghost" size="sm" onClick={() => close(true)}>Close</Button></div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Slippage tolerance</p>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {SWAP_SLIPPAGE_PRESETS_BPS.map((bps) => <Button key={bps} variant={slippageBps === bps ? "primary" : "secondary"} size="sm" aria-pressed={slippageBps === bps} onClick={() => onSlippageChange(bps)} className="min-h-9 px-2">{formatSwapSlippagePercent(bps)}</Button>)}
              <label className="relative"><span className="sr-only">Custom slippage percentage</span><Input type="number" min={MIN_SWAP_SLIPPAGE_BPS / 100} max={MAX_SWAP_SLIPPAGE_BPS / 100} step="0.1" value={(slippageBps / 100).toString()} onChange={(event) => onSlippageChange(Math.max(MIN_SWAP_SLIPPAGE_BPS, Math.min(MAX_SWAP_SLIPPAGE_BPS, Math.round(Number(event.target.value) * 100))))} className="min-h-9 px-2 text-xs" /></label>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500">Allowed range 0.01%–5%. Quotes enforce minimum received.</p>
          </div>
          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-[var(--pc-radius-control)] border border-slate-200 p-3 dark:border-white/10"><input type="checkbox" checked={protection} onChange={(event) => onProtectionChange(event.target.checked)} className="mt-0.5 size-4 accent-[#173b2d]"/><span><span className="block text-xs font-semibold">MEV-aware price protection</span><span className="mt-0.5 block text-[11px] leading-4 text-slate-500">Enforces fresh quotes and minimum received. This does not claim private order flow or a private relay.</span></span></label>
        </div>
      ) : null}
    </div>
  );
}
