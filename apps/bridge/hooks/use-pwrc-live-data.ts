"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api/browser-api";

type LiveState = { data: unknown; loading: boolean; error: string | null; updatedAt: number | null };

export function usePwrcLiveData(solanaOwner?: string, suiOwner?: string) {
  const [state, setState] = useState<LiveState>({ data: null, loading: true, error: null, updatedAt: null });
  const generation = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    const current = ++generation.current;
    controller.current?.abort();
    const abort = new AbortController(); controller.current = abort;
    setState((old) => ({ ...old, loading: true, error: null }));
    try {
      const params = new URLSearchParams();
      if (solanaOwner) params.set("solanaOwner", solanaOwner);
      if (suiOwner) params.set("suiOwner", suiOwner);
      const suffix = params.size ? `?${params}` : "";
      const response = await apiFetch(`/api/v1/data/pwrc${suffix}`, { signal: abort.signal, cache: "no-store" });
      const json = await response.json();
      if (!response.ok && response.status !== 503) throw new Error(json?.message || `HTTP ${response.status}`);
      if (generation.current !== current) return;
      setState({ data: json, loading: false, error: null, updatedAt: Date.now() });
    } catch (error) {
      if (abort.signal.aborted || generation.current !== current) return;
      setState((old) => ({ ...old, loading: false, error: error instanceof Error ? error.message : "Live data unavailable" }));
    }
  }, [solanaOwner, suiOwner]);
  useEffect(() => { void refresh(); return () => controller.current?.abort(); }, [refresh]);
  return { ...state, refresh };
}
