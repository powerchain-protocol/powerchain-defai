"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchJson } from "@/lib/data/http-client";
import { ageMs, isProviderHealthPayload, type ProviderHealthPayload } from "@/lib/data/runtime-validation";

export function useProviderHealth(refreshMs = 30_000) {
  const [data, setData] = useState<ProviderHealthPayload>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [lastSuccessfulAt, setLastSuccessfulAt] = useState<number>();
  const requestGeneration = useRef(0);
  const activeController = useRef<AbortController>();

  const refresh = useCallback(async () => {
    const generation = ++requestGeneration.current;
    activeController.current?.abort();
    const controller = new AbortController();
    activeController.current = controller;
    try {
      const result = await fetchJson<unknown>("/api/v1/providers/health", {
        timeoutMs: 6_000,
        maxAttempts: 1,
        signal: controller.signal,
      });
      if (generation !== requestGeneration.current) return;
      if (!isProviderHealthPayload(result)) throw new Error("Provider health response was invalid");
      setData(result);
      setLastSuccessfulAt(Date.now());
      setError(undefined);
    } catch (reason) {
      if (controller.signal.aborted || generation !== requestGeneration.current) return;
      setError(reason instanceof Error ? reason.message : "Provider health unavailable");
    } finally {
      if (generation === requestGeneration.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible" && navigator.onLine) void refresh();
    }, Math.max(10_000, Math.min(refreshMs, 120_000)));
    const onVisible = () => { if (document.visibilityState === "visible" && navigator.onLine) void refresh(); };
    const onOnline = () => void refresh();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);
    return () => {
      activeController.current?.abort();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
    };
  }, [refresh, refreshMs]);

  const payloadAgeMs = ageMs(data?.checkedAt);
  const stale = payloadAgeMs > Math.max(60_000, refreshMs * 2);
  return {
    data,
    error,
    loading,
    stale,
    payloadAgeMs,
    lastSuccessfulAt,
    degraded: data?.status === "degraded" || stale,
    unavailable: data?.status === "unavailable",
    refresh,
  };
}
