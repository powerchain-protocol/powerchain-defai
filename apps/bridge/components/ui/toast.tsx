"use client";

import { useEffect, useState } from "react";
import { dismissToast, subscribeToToasts, type ToastMessage } from "../../lib/toast";

const toneStyles: Record<ToastMessage["tone"], string> = {
  success: "border-[#9eafa7]/60",
  info: "border-slate-200 dark:border-white/10",
  warning: "border-amber-300/70 dark:border-amber-800/70",
  error: "border-rose-300/70 dark:border-rose-900/70",
};

export function ToastViewport() {
  const [items, setItems] = useState<ToastMessage[]>([]);
  useEffect(() => subscribeToToasts((event) => {
    if (event.kind === "dismiss") { setItems((current) => current.filter((item) => item.id !== event.id)); return; }
    const message = event.toast;
    setItems((current) => [...current.filter((item) => item.id !== message.id).slice(-3), message]);
    window.setTimeout(() => dismissToast(message.id), message.durationMs);
  }), []);
  return (
    <div className="pointer-events-none fixed inset-x-3 top-3 z-[110] ml-auto flex max-w-sm flex-col gap-2 sm:inset-x-auto sm:right-4 sm:top-4" aria-live="polite" aria-relevant="additions">
      {items.map((item) => (
        <div key={item.id} className={`pc-review-sheet pointer-events-auto rounded-[18px] border p-4 text-sm ${toneStyles[item.tone]}`} role={item.tone === "error" ? "alert" : "status"}>
          <div className="flex gap-3"><div className="min-w-0 flex-1"><div className="font-semibold text-slate-950 dark:text-white">{item.title}</div>{item.description ? <div className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{item.description}</div> : null}</div><button type="button" onClick={() => dismissToast(item.id)} className="h-8 w-8 shrink-0 rounded-lg text-slate-500 hover:bg-black/5 dark:hover:bg-white/5" aria-label="Dismiss notification">×</button></div>
        </div>
      ))}
    </div>
  );
}
