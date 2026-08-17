"use client";
import { apiFetch } from "@/lib/api/browser-api";

import { useCallback, useEffect, useRef, useState } from "react";

type IntegrityPayload = {
  asset: "PWRC";
  healthy: boolean;
  checkedAt: string;
  assetFingerprint?: string;
  fingerprintPinned?: boolean;
  solana?: { ok: boolean; data?: { healthy?: boolean; finalizedSlot?: number | null;
      headAgeMs?: number | null;
      fingerprint?: string; checks?: Array<{ id: string; ok: boolean }> }; error?: string };
  sui?: { ok: boolean; data?: { healthy?: boolean; chainIdentifier?: string | null;
      headAgeMs?: number | null;
      fingerprint?: string; checks?: Array<{ id: string; ok: boolean }> }; error?: string };
};

function valid(value: unknown): value is IntegrityPayload {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return v.asset === "PWRC" && typeof v.healthy === "boolean" && typeof v.checkedAt === "string";
}

export function usePwrcIntegrity() {
  const [data, setData] = useState<IntegrityPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);
  const controller = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    const id = ++generation.current;
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    setLoading(true);
    setError(null);
    const timer = window.setTimeout(() => abort.abort(), 8_000);
    try {
      const response = await apiFetch("/api/v1/data/pwrc/integrity", { cache: "no-store", signal: abort.signal });
      const body: unknown = await response.json();
      if (id !== generation.current) return;
      if (!valid(body)) throw new Error("Invalid integrity response");
      setData(body);
      if (!response.ok && !body.healthy) setError("PowerChain asset integrity needs attention");
    } catch (cause) {
      if (id !== generation.current || abort.signal.aborted) return;
      setError(cause instanceof Error ? cause.message : "Integrity check unavailable");
    } finally {
      window.clearTimeout(timer);
      if (id === generation.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onOnline = () => void refresh();
    window.addEventListener("online", onOnline);
    return () => {
      generation.current += 1;
      controller.current?.abort();
      window.removeEventListener("online", onOnline);
    };
  }, [refresh]);

  return { data, loading, error, refresh };
}
