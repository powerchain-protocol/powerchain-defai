"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { StakingStatus } from "@powerchain/staking";
import { BRIDGE_API_ENDPOINTS } from "@/backend/endpoints";

const DEFAULT_REFRESH_MS = 30_000;
const REQUEST_TIMEOUT_MS = 8_000;

interface ApiEnvelope<T> {
  readonly data?: T;
  readonly error?: { readonly message?: string };
}

export function useStakingRuntime(initial: StakingStatus, refreshMs = DEFAULT_REFRESH_MS) {
  const [status, setStatus] = useState<StakingStatus>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);
  const activeController = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    const currentGeneration = ++generation.current;
    activeController.current?.abort();
    const controller = new AbortController();
    activeController.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    setLoading(true);
    try {
      const response = await fetch(BRIDGE_API_ENDPOINTS.staking.status, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
        headers: { accept: "application/json" },
      });
      const payload = await response.json() as ApiEnvelope<StakingStatus> | StakingStatus;
      const next = "data" in payload && payload.data ? payload.data : payload as StakingStatus;
      if (!response.ok || !Array.isArray(next.configurations)) {
        const message = "error" in payload ? payload.error?.message : undefined;
        throw new Error(message ?? `Staking runtime request failed (${response.status}).`);
      }
      if (generation.current === currentGeneration) {
        setStatus(next);
        setError(null);
      }
    } catch (reason) {
      if (generation.current !== currentGeneration) return;
      setError(reason instanceof Error ? reason.message : "Unable to refresh staking runtime.");
    } finally {
      window.clearTimeout(timeout);
      if (activeController.current === controller) activeController.current = null;
      if (generation.current === currentGeneration) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible" && navigator.onLine) void refresh();
    }, Math.max(10_000, refreshMs));
    const onFocus = () => { if (navigator.onLine) void refresh(); };
    const onOnline = () => { void refresh(); };
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);
    return () => {
      generation.current += 1;
      activeController.current?.abort();
      activeController.current = null;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
    };
  }, [refresh, refreshMs]);

  return { status, loading, error, refresh };
}
