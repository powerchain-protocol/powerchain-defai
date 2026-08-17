"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button, buttonClassName } from "@/components/ui/button";
import { bridgeStatusRoute } from "@/config/app-routes";

export function TransferDeepLink({ transferId, className = "" }: { transferId: string; className?: string }) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const resetTimer = useRef<number | null>(null);
  const href = bridgeStatusRoute(transferId);

  useEffect(() => () => {
    if (resetTimer.current != null) window.clearTimeout(resetTimer.current);
  }, []);

  async function copy() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("CLIPBOARD_UNAVAILABLE");
      await navigator.clipboard.writeText(new URL(href, window.location.origin).toString());
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
    if (resetTimer.current != null) window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setCopyState("idle"), 1800);
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <Link href={href} className={buttonClassName({ variant: "primary", size: "sm" })}>Open transfer</Link>
      <Button size="sm" variant="secondary" onClick={() => void copy()} aria-label="Copy transfer status link">
        {copyState === "copied" ? "Link copied" : copyState === "error" ? "Copy failed" : "Copy link"}
      </Button>
      <span className="sr-only" aria-live="polite">
        {copyState === "copied" ? "Transfer status link copied" : copyState === "error" ? "Could not copy transfer status link" : ""}
      </span>
    </div>
  );
}
