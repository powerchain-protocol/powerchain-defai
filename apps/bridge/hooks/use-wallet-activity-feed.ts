"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useWalletActivityFeed(solanaAddress?: string | null, suiAddress?: string | null, limit = 25) {
  const [pages, setPages] = useState<any[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const load = useCallback(async (nextCursor: string | null, append: boolean) => {
    if (!solanaAddress && !suiAddress) { setPages([]); setCursor(null); setError(null); return; }
    const current = ++generation.current;
    controller.current?.abort(); const abort = new AbortController(); controller.current = abort;
    const timer = window.setTimeout(() => abort.abort(), 10_000); setLoading(true); setError(null);
    try {
      const url = new URL("/api/v1/wallet/activity", window.location.origin);
      if (solanaAddress) url.searchParams.set("solanaAddress", solanaAddress);
      if (suiAddress) url.searchParams.set("suiAddress", suiAddress);
      url.searchParams.set("limit", String(Math.max(1, Math.min(limit, 50))));
      if (nextCursor) url.searchParams.set("cursor", nextCursor);
      const response = await fetch(url, { cache: "no-store", signal: abort.signal }); const payload = await response.json();
      if (current !== generation.current) return;
      if (!response.ok && response.status !== 503) throw new Error(payload?.message || `HTTP ${response.status}`);
      setPages((old) => append ? [...old, payload] : [payload]); setCursor(payload?.pagination?.nextCursor || null);
      if (!response.ok && payload?.status !== "degraded") setError(payload?.message || "Wallet activity unavailable");
    } catch (cause) { if (current === generation.current) setError(abort.signal.aborted ? "Wallet activity request timed out" : cause instanceof Error ? cause.message : "Wallet activity unavailable"); }
    finally { window.clearTimeout(timer); if (current === generation.current) setLoading(false); }
  }, [solanaAddress, suiAddress, limit]);
  const refresh = useCallback(() => load(null, false), [load]);
  const loadMore = useCallback(() => cursor ? load(cursor, true) : Promise.resolve(), [cursor, load]);
  useEffect(() => { void refresh(); return () => controller.current?.abort(); }, [refresh]);
  return { pages, activity: pages.flatMap((page) => Array.isArray(page?.activity) ? page.activity : []), loading, error, hasNextPage: Boolean(cursor), refresh, loadMore };
}
