"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type LiveState = { data: unknown; loading: boolean; error: string | null; updatedAt: number | null };

export function usePwrcLiveData(solanaOwner?: string, suiOwner?: string) {
  const [state, setState] = useState<LiveState>({ data: null, loading: true, error: null, updatedAt: null });
  const generation = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    const current = ++generation.current;
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    setState((old) => ({ ...old, loading: true, error: null }));
    try {
      const url = new URL("/api/v1/data/pwrc", window.location.origin);
      if (solanaOwner) url.searchParams.set("solanaOwner", solanaOwner);
      if (suiOwner) url.searchParams.set("suiOwner", suiOwner);
      const response = await fetch(url, { signal: abort.signal, cache: "no-store" });
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
