"use client";

import { useEffect, useState } from "react";
import { subscribeToToasts, type ToastMessage } from "../../lib/toast";

export function ToastViewport() {
  const [items, setItems] = useState<ToastMessage[]>([]);
  useEffect(() => subscribeToToasts((message) => {
    setItems((current) => [...current.slice(-4), message]);
    const timer = window.setTimeout(() => setItems((current) => current.filter((item) => item.id !== message.id)), message.durationMs);
    return () => window.clearTimeout(timer);
  }), []);
  return (
    <div className="pointer-events-none fixed inset-x-4 top-4 z-[100] ml-auto flex max-w-sm flex-col gap-2" aria-live="polite" aria-relevant="additions">
      {items.map((item) => (
        <div key={item.id} className="pointer-events-auto rounded-xl border bg-white p-4 text-sm shadow-lg dark:bg-slate-950" role={item.tone === "error" ? "alert" : "status"}>
          <div className="font-semibold">{item.title}</div>
          {item.description ? <div className="mt-1 text-slate-600 dark:text-slate-300">{item.description}</div> : null}
        </div>
      ))}
    </div>
  );
}
