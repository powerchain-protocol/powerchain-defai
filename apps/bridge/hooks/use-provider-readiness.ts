"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchJson } from "@/lib/data/http-client";
import { isProviderReadinessPayload, type ProviderReadinessPayload } from "@/lib/data/runtime-validation";

export function useProviderReadiness(refreshMs = 60_000) {
  const [data, setData] = useState<ProviderReadinessPayload>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const controller = useRef<AbortController>();

  const refresh = useCallback(async () => {
    controller.current?.abort();
    const next = new AbortController();
    controller.current = next;
    try {
      const result = await fetchJson<unknown>("/api/v1/providers/readiness", { timeoutMs: 6_000, maxAttempts: 1, signal: next.signal });
      if (!isProviderReadinessPayload(result)) throw new Error("Provider readiness response was invalid");
      setData(result);
      setError(undefined);
    } catch (reason) {
      if (!next.signal.aborted) setError(reason instanceof Error ? reason.message : "Provider readiness unavailable");
    } finally {
      if (!next.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible" && navigator.onLine) void refresh();
    }, Math.max(30_000, Math.min(refreshMs, 180_000)));
    return () => { controller.current?.abort(); clearInterval(interval); };
  }, [refresh, refreshMs]);

  return { data, error, loading, ready: data?.ready === true, reducedRedundancy: data?.redundancy === "reduced", refresh };
}
