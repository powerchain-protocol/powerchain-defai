"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useWalletPortfolio(solanaAddress?: string | null, suiAddress?: string | null) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    if (!solanaAddress && !suiAddress) { setData(null); setError(null); setLoading(false); return; }
    const current = ++generation.current;
    controller.current?.abort();
    const abort = new AbortController(); controller.current = abort;
    const timer = window.setTimeout(() => abort.abort(), 10_000);
    setLoading(true); setError(null);
    try {
      const url = new URL("/api/v1/wallet/portfolio", window.location.origin);
      if (solanaAddress) url.searchParams.set("solanaAddress", solanaAddress);
      if (suiAddress) url.searchParams.set("suiAddress", suiAddress);
      const response = await fetch(url, { cache: "no-store", signal: abort.signal });
      const payload = await response.json();
      if (current !== generation.current) return;
      if (!response.ok && response.status !== 503) throw new Error(payload?.message || `HTTP ${response.status}`);
      setData(payload);
      setError(response.ok || payload?.status === "degraded" ? null : payload?.message || "Wallet portfolio unavailable");
    } catch (cause) {
      if (current !== generation.current) return;
      setError(abort.signal.aborted ? "Wallet portfolio request timed out" : cause instanceof Error ? cause.message : "Wallet portfolio unavailable");
    } finally { window.clearTimeout(timer); if (current === generation.current) setLoading(false); }
  }, [solanaAddress, suiAddress]);
  useEffect(() => { void refresh(); return () => controller.current?.abort(); }, [refresh]);
  return { data, loading, error, refresh };
}
