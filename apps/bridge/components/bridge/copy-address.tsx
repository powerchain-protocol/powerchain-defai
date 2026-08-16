"use client";

import { useEffect, useRef, useState } from "react";

function compact(value: string, left = 6, right = 5) {
  return value.length <= left + right + 3 ? value : `${value.slice(0, left)}…${value.slice(-right)}`;
}

export function CopyAddress({ value, label = "address" }: { value: string; label?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");
  const resetTimer = useRef<number | null>(null);
  useEffect(() => () => { if (resetTimer.current != null) window.clearTimeout(resetTimer.current); }, []);

  async function copy() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setState("error");
    }
    if (resetTimer.current != null) window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setState("idle"), 1800);
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      title={value}
      aria-label={`Copy ${label}`}
      className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 font-mono text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-slate-700 motion-reduce:transition-none"
    >
      <span>{compact(value)}</span>
      <span className={`font-sans text-[11px] ${state === "error" ? "text-red-600 dark:text-red-400" : "text-slate-500"}`} aria-live="polite">{state === "copied" ? "Copied" : state === "error" ? "Failed" : "Copy"}</span>
    </button>
  );
}
