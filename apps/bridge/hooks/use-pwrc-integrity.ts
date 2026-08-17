"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api/browser-api";
import { isAbortError } from "@/utils/helpers";

type IntegrityPayload = {
  asset: "PWRC";
  healthy: boolean;
  checkedAt: string;
  assetFingerprint?: string;
  fingerprintPinned?: boolean;
  solana?: { ok: boolean; data?: { healthy?: boolean; finalizedSlot?: number | null; headAgeMs?: number | null; fingerprint?: string; checks?: Array<{ id: string; ok: boolean }> }; error?: string };
  sui?: { ok: boolean; data?: { healthy?: boolean; chainIdentifier?: string | null; headAgeMs?: number | null; fingerprint?: string; checks?: Array<{ id: string; ok: boolean }> }; error?: string };
};

const STALE_AFTER_MS = 90_000;

function valid(value: unknown): value is IntegrityPayload {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return v.asset === "PWRC" && typeof v.healthy === "boolean" && typeof v.checkedAt === "string";
}

export function usePwrcIntegrity() {
  const [data, setData] = useState<IntegrityPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [online, setOnline] = useState(() => typeof navigator === "undefined" ? true : navigator.onLine);
  const [now, setNow] = useState(() => Date.now());
  const generation = useRef(0);
  const controller = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setLoading(false);
      setError("INTEGRITY_OFFLINE");
      return;
    }
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
      if (id !== generation.current || abort.signal.aborted) return;
      if (!valid(body)) throw new Error("INTEGRITY_RESPONSE_INVALID");
      setData(body);
      setNow(Date.now());
      if (!response.ok && !body.healthy) setError("INTEGRITY_ATTENTION_REQUIRED");
    } catch (cause) {
      if (id !== generation.current || abort.signal.aborted || isAbortError(cause)) return;
      setError("INTEGRITY_UNAVAILABLE");
    } finally {
      window.clearTimeout(timer);
      if (id === generation.current && !abort.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const update = () => {
      const next = navigator.onLine;
      setOnline(next);
      if (!next) {
        generation.current += 1;
        controller.current?.abort();
        setLoading(false);
        setError("INTEGRITY_OFFLINE");
      }
    };
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      generation.current += 1;
      controller.current?.abort();
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    if (!online) return;
    void refresh();
  }, [online, refresh]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(timer);
  }, []);

  const checkedAt = data ? Date.parse(data.checkedAt) : Number.NaN;
  const stale = Boolean(data && (!Number.isFinite(checkedAt) || now - checkedAt > STALE_AFTER_MS));
  return { data, loading, error, online, stale, refresh };
}
