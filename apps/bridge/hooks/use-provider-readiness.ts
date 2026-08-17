"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  PROVIDER_READINESS_REFRESH_MAX_MS,
  PROVIDER_READINESS_REFRESH_MIN_MS,
  clampRefreshMs,
} from "@/constants/provider-runtime";
import { providerClient } from "@/backend/provider-client";
import { providerErrorMessage } from "@/common/provider-errors";
import { ageMs, type ProviderReadinessPayload } from "@/lib/data/runtime-validation";

export function useProviderReadiness(refreshMs = 60_000) {
  const [data, setData] = useState<ProviderReadinessPayload | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [online, setOnline] = useState(true);
  const [lastSuccessfulAt, setLastSuccessfulAt] = useState<number | undefined>(undefined);
  const requestGeneration = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const intervalMs = clampRefreshMs(refreshMs, PROVIDER_READINESS_REFRESH_MIN_MS, PROVIDER_READINESS_REFRESH_MAX_MS);

  const refresh = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setOnline(false);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setOnline(true);
    setRefreshing(true);
    const generation = ++requestGeneration.current;
    controller.current?.abort();
    const next = new AbortController();
    controller.current = next;
    try {
      const result = await providerClient.readiness({ signal: next.signal });
      if (generation !== requestGeneration.current) return;
      setData(result);
      setLastSuccessfulAt(Date.now());
      setError(undefined);
    } catch (reason) {
      if (next.signal.aborted || generation !== requestGeneration.current) return;
      setError(providerErrorMessage(reason, "Provider readiness unavailable"));
    } finally {
      if (generation === requestGeneration.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    const syncOnline = () => setOnline(navigator.onLine);
    syncOnline();
    if (navigator.onLine) void refresh(); else setLoading(false);
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible" && navigator.onLine) void refresh();
    }, intervalMs);
    const onVisible = () => { if (document.visibilityState === "visible" && navigator.onLine) void refresh(); };
    const onOnline = () => { setOnline(true); void refresh(); };
    const onOffline = () => {
      setOnline(false);
      controller.current?.abort();
      setRefreshing(false);
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      requestGeneration.current += 1;
      controller.current?.abort();
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [intervalMs, refresh]);

  const payloadAgeMs = ageMs(data?.checkedAt);
  const stale = payloadAgeMs > Math.max(120_000, intervalMs * 2);
  return {
    data,
    error,
    loading,
    refreshing,
    online,
    stale,
    payloadAgeMs,
    lastSuccessfulAt,
    ready: online && !stale && data?.ready === true,
    reducedRedundancy: data?.redundancy === "reduced",
    refresh,
  };
}
