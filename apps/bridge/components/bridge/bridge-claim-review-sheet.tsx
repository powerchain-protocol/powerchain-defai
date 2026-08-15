"use client";

import { useEffect, useId, useRef } from "react";
import { ActionStateButton } from "../wallet/action-state-button";

export type ReviewLine = { label: string; value: string; emphasis?: boolean };

export function BridgeClaimReviewSheet({ open, title, description, lines, warning, confirmLabel = "Confirm & continue", pendingLabel = "Waiting for wallet…", onConfirm, onClose }: { open: boolean; title: string; description: string; lines: ReviewLine[]; warning?: string | null; confirmLabel?: string; pendingLabel?: string; onConfirm: () => Promise<void>; onClose: () => void }) {
  const titleId = useId();
  const descId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = requestAnimationFrame(() => closeRef.current?.focus());
    const handler = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handler);
      previousFocusRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 sm:items-center sm:p-6" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descId} className="max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-slate-950 sm:max-w-lg sm:rounded-3xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div><div className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Final review</div><h2 id={titleId} className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">{title}</h2><p id={descId} className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p></div>
          <button ref={closeRef} type="button" onClick={onClose} className="min-h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700" aria-label="Close review">Close</button>
        </div>
        <dl className="mt-5 divide-y divide-slate-200 rounded-2xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {lines.map((line) => <div key={line.label} className="flex items-start justify-between gap-4 px-4 py-3"><dt className="text-sm text-slate-500">{line.label}</dt><dd className={`max-w-[65%] break-words text-right text-sm ${line.emphasis ? "font-semibold text-slate-950 dark:text-white" : "font-medium text-slate-700 dark:text-slate-300"}`}>{line.value}</dd></div>)}
        </dl>
        {warning ? <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200">{warning}</div> : null}
        <div className="mt-5 grid gap-2 sm:grid-cols-2"><button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700">Cancel</button><ActionStateButton onAction={onConfirm} pendingLabel={pendingLabel} className="bg-[#0B1730] text-white">{confirmLabel}</ActionStateButton></div>
      </section>
    </div>
  );
}
