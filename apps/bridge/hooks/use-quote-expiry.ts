"use client";

import { useEffect, useMemo, useState } from "react";

export function useQuoteExpiry(expiresAt: string | Date | null | undefined, skewMs = 1_500) {
  const target = useMemo(() => {
    if (!expiresAt) return null;
    const value = expiresAt instanceof Date ? expiresAt.getTime() : Date.parse(expiresAt);
    return Number.isFinite(value) ? value : null;
  }, [expiresAt]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (target == null) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [target]);

  const remainingMs = target == null ? null : Math.max(0, target - now - skewMs);
  const expired = remainingMs === 0 && target != null;
  const seconds = remainingMs == null ? null : Math.ceil(remainingMs / 1_000);
  const label = seconds == null ? "—" : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  return { remainingMs, seconds, label, expired };
}
