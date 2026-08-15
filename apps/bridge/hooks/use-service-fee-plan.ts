"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type FeePlanChain = "SOLANA" | "SUI";
export type ServiceFeePlan = {
  routeId: string;
  sourceChain: FeePlanChain;
  assetId: string;
  feeBps: number;
  recipient: string;
  principalBaseUnits: string;
  feeBaseUnits: string;
  totalSourceDebitBaseUnits: string;
  principalRule: string;
  signing: string;
};

type Envelope<T> = { data?: T; error?: { code?: string; message?: string } };

export function useServiceFeePlan(input: {
  routeId?: string | null;
  sourceChain?: FeePlanChain | null;
  principalBaseUnits?: bigint | null;
  enabled?: boolean;
  debounceMs?: number;
  timeoutMs?: number;
}) {
  const [plan, setPlan] = useState<ServiceFeePlan | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const requestId = useRef(0);
  const controller = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    const routeId = input.routeId?.trim();
    const chain = input.sourceChain;
    const principal = input.principalBaseUnits;
    if (input.enabled === false || !routeId || !chain || principal == null || principal <= 0n) {
      controller.current?.abort();
      setPlan(null);
      setStatus("idle");
      setError(null);
      return;
    }

    const current = ++requestId.current;
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    const timeoutMs = Math.max(2_000, Math.min(20_000, input.timeoutMs ?? 8_000));
    const timeout = window.setTimeout(() => abort.abort("timeout"), timeoutMs);
    setStatus("loading");
    setError(null);

    try {
      const qs = new URLSearchParams({ routeId, sourceChain: chain, principalBaseUnits: principal.toString() });
      const response = await fetch(`/api/v1/fees/collection-plan?${qs.toString()}`, {
        cache: "no-store",
        headers: { accept: "application/json" },
        signal: abort.signal,
      });
      const payload = (await response.json()) as Envelope<ServiceFeePlan>;
      if (!response.ok || !payload.data) throw new Error(payload.error?.message || payload.error?.code || `Fee plan unavailable (${response.status})`);
      if (current !== requestId.current) return;
      setPlan(payload.data);
      setStatus("ready");
      setUpdatedAt(Date.now());
    } catch (cause) {
      if (current !== requestId.current) return;
      setStatus("error");
      if (abort.signal.aborted) setError("Fee estimate timed out. Refresh before signing.");
      else setError(cause instanceof Error ? cause.message : "Fee plan unavailable");
    } finally {
      window.clearTimeout(timeout);
    }
  }, [input.routeId, input.sourceChain, input.principalBaseUnits, input.enabled, input.timeoutMs]);

  useEffect(() => {
    const delay = Math.max(0, Math.min(1500, input.debounceMs ?? 350));
    const timer = setTimeout(() => void load(), delay);
    return () => { clearTimeout(timer); controller.current?.abort(); };
  }, [load, input.debounceMs]);

  return { plan, status, error, updatedAt, refresh: load };
}
