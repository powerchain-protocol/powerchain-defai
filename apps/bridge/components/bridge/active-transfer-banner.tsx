"use client";

import Link from "next/link";
import { Button, buttonClassName } from "@/components/ui/button";
import { bridgeStatusRoute } from "@/config/app-routes";
import { useResumableTransfer } from "@/hooks/use-resumable-transfer";
import { CopyAddress } from "./copy-address";

export function ActiveTransferBanner() {
  const { active, clear } = useResumableTransfer();
  if (!active) return null;

  return (
    <aside
      className="sticky top-20 z-30 rounded-[var(--pc-radius-card)] border border-[#d4ddd8] bg-white p-3 shadow-[0_8px_24px_rgba(7,16,13,.07)] lg:top-2 dark:border-[#29483c] dark:bg-slate-950"
      aria-label="Active bridge transfer"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#294a3b] dark:text-[#adc0b6]">Transfer in progress</p>
          <div className="mt-1"><CopyAddress value={active.transferId} label="active transfer ID" /></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={bridgeStatusRoute(active.transferId)} className={buttonClassName({ variant: "primary", size: "sm" })}>View status</Link>
          <Button size="sm" variant="secondary" onClick={clear}>Dismiss</Button>
        </div>
      </div>
    </aside>
  );
}
