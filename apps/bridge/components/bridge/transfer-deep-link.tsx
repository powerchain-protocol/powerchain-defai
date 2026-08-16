"use client";

import { useEffect, useRef, useState } from "react";

export function TransferDeepLink({ transferId, className = "" }: { transferId: string; className?: string }) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const resetTimer = useRef<number | null>(null);
  const href = `/bridge/status/${encodeURIComponent(transferId)}`;
  useEffect(() => () => { if (resetTimer.current != null) window.clearTimeout(resetTimer.current); }, []);
  async function copy() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      const absolute = new URL(href, window.location.origin).toString();
      await navigator.clipboard.writeText(absolute);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
    if (resetTimer.current != null) window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setCopyState("idle"), 1800);
  }
  return <div className={`flex flex-wrap items-center gap-2 ${className}`}>
    <a href={href} className="inline-flex min-h-9 items-center rounded-lg bg-[#173b2d] px-3 text-xs font-semibold text-white hover:bg-[#102b21] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] focus-visible:ring-offset-2">Open transfer</a>
    <button type="button" onClick={() => void copy()} aria-label="Copy transfer status link" className="min-h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] dark:border-slate-700 dark:text-slate-200">{copyState === "copied" ? "Link copied" : copyState === "error" ? "Copy failed" : "Copy link"}</button>
    <span className="sr-only" aria-live="polite">{copyState === "copied" ? "Transfer status link copied" : copyState === "error" ? "Could not copy transfer status link" : ""}</span>
  </div>;
}
