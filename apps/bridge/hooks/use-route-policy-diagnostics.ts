"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchRoutePolicyDiagnostics } from "@/backend/route-policy-client";
import { providerErrorMessage } from "@/common/provider-errors";
import type { RoutePolicyDiagnosticsPayload } from "@/types/route-policy";

export function useRoutePolicyDiagnostics(refreshMs = 60_000) {
  const [data, setData] = useState<RoutePolicyDiagnosticsPayload | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const generation = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const intervalMs = Math.min(300_000, Math.max(15_000, refreshMs));

  const refresh = useCallback(async () => {
    const current = ++generation.current;
    controller.current?.abort();
    const next = new AbortController();
    controller.current = next;
    setRefreshing(true);
    try {
      const result = await fetchRoutePolicyDiagnostics(next.signal);
      if (current !== generation.current) return;
      setData(result);
      setError(undefined);
    } catch (reason) {
      if (next.signal.aborted || current !== generation.current) return;
      setError(providerErrorMessage(reason, "Route policy diagnostics unavailable"));
    } finally {
      if (current === generation.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    if (navigator.onLine) void refresh(); else setLoading(false);
    const timer = window.setInterval(() => {
      if (navigator.onLine && document.visibilityState === "visible") void refresh();
    }, intervalMs);
    const onOnline = () => void refresh();
    const onVisible = () => { if (document.visibilityState === "visible" && navigator.onLine) void refresh(); };
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      generation.current += 1;
      controller.current?.abort();
      window.clearInterval(timer);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [intervalMs, refresh]);

  return { data, error, loading, refreshing, refresh };
}
