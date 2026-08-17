"use client";

import { Button } from "@/components/ui/button";

type Props = { label: string; disabled?: boolean; pending?: boolean; reason?: string | null; onClick: () => void };

export function MobileReviewActionBar({ label, disabled = false, pending = false, reason, onClick }: Props) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 pt-3 shadow-[0_-12px_32px_rgba(7,16,13,.07)] backdrop-blur-xl dark:border-white/10 dark:bg-[#07100d]/95 sm:hidden"
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      {reason ? <p className="mb-2 text-center text-xs text-slate-500" aria-live="polite">{reason}</p> : null}
      <Button variant="primary" size="lg" onClick={onClick} disabled={disabled} loading={pending} loadingLabel="Please wait…" className="w-full">
        {label}
      </Button>
    </div>
  );
}
