"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  PROVIDER_HEALTH_REFRESH_MAX_MS,
  PROVIDER_HEALTH_REFRESH_MIN_MS,
  PROVIDER_REQUEST_TIMEOUT_MS,
  clampRefreshMs,
} from "@/constants/provider-runtime";
import { fetchJson } from "@/lib/data/http-client";
import { ageMs, isProviderHealthPayload, type ProviderHealthPayload } from "@/lib/data/runtime-validation";

export function useProviderHealth(refreshMs = 30_000) {
  const [data, setData] = useState<ProviderHealthPayload | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSuccessfulAt, setLastSuccessfulAt] = useState<number | undefined>(undefined);
  const [online, setOnline] = useState(true);
  const requestGeneration = useRef(0);
  const activeController = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    const generation = ++requestGeneration.current;
    activeController.current?.abort();
    const controller = new AbortController();
    activeController.current = controller;
    try {
      const result = await fetchJson<unknown>("/api/v1/providers/health", {
        timeoutMs: PROVIDER_REQUEST_TIMEOUT_MS,
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
      if (generation === requestGeneration.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  const intervalMs = clampRefreshMs(refreshMs, PROVIDER_HEALTH_REFRESH_MIN_MS, PROVIDER_HEALTH_REFRESH_MAX_MS);

  useEffect(() => {
    const syncOnline = () => setOnline(navigator.onLine);
    syncOnline();
    if (navigator.onLine) void refresh(); else setLoading(false);
    const interval = setInterval(() => {
      if (document.visibilityState === "visible" && navigator.onLine) void refresh();
    }, intervalMs);
    const onVisible = () => { if (document.visibilityState === "visible" && navigator.onLine) void refresh(); };
    const onOnline = () => { setOnline(true); void refresh(); };
    const onOffline = () => setOnline(false);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      requestGeneration.current += 1;
      activeController.current?.abort();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [intervalMs, refresh]);

  const payloadAgeMs = ageMs(data?.checkedAt);
  const stale = payloadAgeMs > Math.max(60_000, intervalMs * 2);
  return {
    data,
    error,
    loading,
    refreshing,
    stale,
    payloadAgeMs,
    lastSuccessfulAt,
    degraded: data?.status === "degraded" || stale,
    unavailable: data?.status === "unavailable",
    online,
    refresh,
  };
}
