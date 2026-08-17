"use client";

import Link from "next/link";
import { Button, buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { bridgeStatusRoute } from "@/config/app-routes";
import { useResumableTransfer } from "@/hooks/use-resumable-transfer";

export function ResumeTransferCard() {
  const { active, clear } = useResumableTransfer();
  if (!active) return null;

  return (
    <Card as="aside" className="border-[#d4ddd8] bg-[#f7f9f8] p-4 dark:border-[#29483c] dark:bg-[#09110e]/55" aria-label="Resume active transfer">
      <p className="text-sm font-semibold text-slate-950 dark:text-white">Transfer in progress</p>
      <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600 dark:text-slate-300">
        Resume the persisted transfer instead of starting a duplicate after reloading the app.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href={bridgeStatusRoute(active.transferId)} className={buttonClassName({ variant: "primary", size: "sm" })}>Resume transfer</Link>
        <Button size="sm" variant="secondary" onClick={clear}>Dismiss</Button>
      </div>
    </Card>
  );
}
