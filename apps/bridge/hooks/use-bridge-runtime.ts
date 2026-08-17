"use client";
import { apiFetch } from "@/lib/api/browser-api";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNetworkOnline } from "./use-network-online";

export type BridgeRuntimePayload = {
  status: "ready" | "degraded" | "blocked";
  capabilities: { quote: boolean; "wallet-signature": boolean; "transfer-submit": boolean; "status-tracking": boolean };
  canRequestQuote: boolean;
  canOpenWalletSignature: boolean;
  canSubmitTransfer: boolean;
  canTrackStatus: boolean;
  snapshotId: string;
  checkedAt: string;
  validUntil: string;
  checks: Array<{ id: string; ok: boolean; blocking: boolean; detail?: string }>;
  providerReadiness?: {
    ready: boolean;
    degraded: boolean;
    providers: Array<{ provider: "solana" | "sui"; ready: boolean; redundancy: "full" | "reduced" | "none"; head?: string; latencyMs?: number }>;
  } | null;
  assetIntegrity?: { healthy: boolean; fingerprint?: string; pinned?: boolean } | null;
  authoritativeForBridgeAccounting: false;
};

function validPayload(value: unknown): value is BridgeRuntimePayload {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (!("ready degraded blocked".split(" ") as string[]).includes(String(v.status))) return false;
  if (!v.capabilities || typeof v.capabilities !== "object") return false;
  const c = v.capabilities as Record<string, unknown>;
  for (const key of ["quote", "wallet-signature", "transfer-submit", "status-tracking"]) if (typeof c[key] !== "boolean") return false;
  if (typeof v.canRequestQuote !== "boolean" || typeof v.canOpenWalletSignature !== "boolean" || typeof v.canSubmitTransfer !== "boolean" || typeof v.canTrackStatus !== "boolean") return false;
  if (typeof v.snapshotId !== "string" || typeof v.checkedAt !== "string" || typeof v.validUntil !== "string" || !Array.isArray(v.checks)) return false;
  if (!Number.isFinite(Date.parse(v.checkedAt)) || !Number.isFinite(Date.parse(v.validUntil))) return false;
  if (v.authoritativeForBridgeAccounting !== false) return false;
  return v.checks.every((item) => {
    if (!item || typeof item !== "object") return false;
    const check = item as Record<string, unknown>;
    return typeof check.id === "string" && typeof check.ok === "boolean" && typeof check.blocking === "boolean";
  });
}

export function useBridgeRuntime() {
  const online = useNetworkOnline();
  const [data, setData] = useState<BridgeRuntimePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const generation = useRef(0);
  const controller = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    if (!online) {
      controller.current?.abort();
      setLoading(false);
      setError("Offline");
      return;
    }
    const id = ++generation.current;
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    const timer = window.setTimeout(() => abort.abort("timeout"), 8_000);
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch("/api/v1/bridge/runtime", { cache: "no-store", headers: { accept: "application/json" }, signal: abort.signal });
      const body: unknown = await response.json();
      if (id !== generation.current) return;
      if (!validPayload(body)) throw new Error("Invalid bridge runtime response");
      setData(body);
      setNow(Date.now());
      if (!response.ok && body.status === "blocked") setError("Bridge runtime checks are blocking new submissions");
    } catch (cause) {
      if (id !== generation.current) return;
      if (abort.signal.aborted) setError("Bridge runtime check timed out");
      else setError(cause instanceof Error ? cause.message : "Bridge runtime unavailable");
    } finally {
      window.clearTimeout(timer);
      if (id === generation.current) setLoading(false);
    }
  }, [online]);

  useEffect(() => {
    void refresh();
    const clock = window.setInterval(() => setNow(Date.now()), 1_000);
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      generation.current += 1;
      controller.current?.abort();
      window.clearInterval(clock);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const stale = useMemo(() => !data || now >= Date.parse(data.validUntil), [data, now]);
  const canRequestQuote = Boolean(online && data?.canRequestQuote && !stale);
  const canOpenWalletSignature = Boolean(online && data?.canOpenWalletSignature && !stale);
  const canSubmitTransfer = Boolean(online && data?.canSubmitTransfer && !stale);

  return { data, loading, error, online, stale, canRequestQuote, canOpenWalletSignature, canSubmitTransfer, refresh };
}
