"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api/browser-api";
import type { PwrcTransfersResponse } from "@/lib/types/wallet-api";

export function usePwrcTransfers(address?: string | null, limit = 10) {
  const [data, setData] = useState<PwrcTransfersResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    if (!address) { setData(null); setError(null); return; }
    const current = ++generation.current;
    controller.current?.abort();
    const abort = new AbortController(); controller.current = abort;
    const timer = window.setTimeout(() => abort.abort(), 10_000);
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ address, limit: String(Math.max(1, Math.min(limit, 25))) });
      const response = await apiFetch(`/api/v1/wallet/solana/pwrc-transfers?${params}`, { cache: "no-store", signal: abort.signal });
      const payload = await response.json();
      if (current !== generation.current) return;
      if (!response.ok) throw new Error(payload?.message || payload?.fallbackReason || "PWRC transfer history unavailable");
      setData(payload);
    } catch (cause) {
      if (current === generation.current) setError(abort.signal.aborted ? "PWRC transfer history request timed out" : cause instanceof Error ? cause.message : "PWRC transfer history unavailable");
    } finally {
      window.clearTimeout(timer);
      if (current === generation.current) setLoading(false);
    }
  }, [address, limit]);
  useEffect(() => { void refresh(); return () => controller.current?.abort(); }, [refresh]);
  return { data, loading, error, refresh };
}
