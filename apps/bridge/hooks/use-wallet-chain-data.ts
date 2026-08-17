"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api/browser-api";
import type { WalletChainOverview } from "@/lib/types/wallet-api";

type Chain = "SOLANA" | "SUI";
type State = { data: WalletChainOverview | null; loading: boolean; error: string | null; updatedAt: number | null };

export function useWalletChainData(chain: Chain, address?: string | null) {
  const [state, setState] = useState<State>({ data: null, loading: false, error: null, updatedAt: null });
  const generation = useRef(0);
  const controller = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    if (!address) { setState({ data: null, loading: false, error: null, updatedAt: null }); return; }
    const current = ++generation.current;
    controller.current?.abort();
    const abort = new AbortController(); controller.current = abort;
    const timer = window.setTimeout(() => abort.abort(), 10_000);
    setState((old) => ({ ...old, loading: true, error: null }));
    try {
      const path = chain === "SOLANA" ? "/api/v1/wallet/solana" : "/api/v1/wallet/sui";
      const params = new URLSearchParams({ address, limit: "25" });
      const response = await apiFetch(`${path}?${params}`, { signal: abort.signal, cache: "no-store" });
      const json = await response.json();
      if (!response.ok) throw new Error(json?.message || `HTTP ${response.status}`);
      if (generation.current !== current) return;
      setState({ data: json, loading: false, error: null, updatedAt: Date.now() });
    } catch (error) {
      if (generation.current !== current) return;
      setState((old) => ({ ...old, loading: false, error: abort.signal.aborted ? "Wallet data request timed out" : error instanceof Error ? error.message : "Wallet data unavailable" }));
    } finally { window.clearTimeout(timer); }
  }, [address, chain]);

  useEffect(() => { void refresh(); return () => controller.current?.abort(); }, [refresh]);
  return { ...state, refresh };
}
