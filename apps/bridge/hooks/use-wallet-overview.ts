"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api/browser-api";
import type { WalletOverviewResponse } from "@/lib/types/wallet-api";

type State = { data: WalletOverviewResponse | null; loading: boolean; error: string | null; updatedAt: number | null };

export function useWalletOverview(solanaAddress?: string | null, suiAddress?: string | null) {
  const [state, setState] = useState<State>({ data: null, loading: false, error: null, updatedAt: null });
  const generation = useRef(0);
  const controller = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    if (!solanaAddress && !suiAddress) { setState({ data: null, loading: false, error: null, updatedAt: null }); return; }
    const current = ++generation.current;
    controller.current?.abort();
    const abort = new AbortController(); controller.current = abort;
    const timer = window.setTimeout(() => abort.abort(), 10_000);
    setState((old) => ({ ...old, loading: true, error: null }));
    try {
      const params = new URLSearchParams();
      if (solanaAddress) params.set("solanaAddress", solanaAddress);
      if (suiAddress) params.set("suiAddress", suiAddress);
      params.set("limit", "25");
      const response = await apiFetch(`/api/v1/wallet/overview?${params}`, { signal: abort.signal, cache: "no-store" });
      const json = await response.json();
      if (!response.ok && response.status !== 503) throw new Error(json?.message || `HTTP ${response.status}`);
      if (generation.current !== current) return;
      setState({ data: json, loading: false, error: response.ok || json?.status === "degraded" ? null : json?.message || "Wallet data unavailable", updatedAt: Date.now() });
    } catch (error) {
      if (generation.current !== current) return;
      setState((old) => ({ ...old, loading: false, error: abort.signal.aborted ? "Wallet overview request timed out" : error instanceof Error ? error.message : "Wallet overview unavailable" }));
    } finally { window.clearTimeout(timer); }
  }, [solanaAddress, suiAddress]);

  useEffect(() => { void refresh(); return () => controller.current?.abort(); }, [refresh]);
  return { ...state, refresh };
}
