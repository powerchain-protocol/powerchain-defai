"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchPools, type PoolsResponse, type PoolProvider } from "@/lib/data/pools";
import { isAbortError, safeClientErrorCode } from "@/utils/helpers";

export function usePools(input: { chain?: "SOLANA" | "SUI"; provider?: PoolProvider } = {}) {
  const [data, setData] = useState<PoolsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [online, setOnline] = useState(() => typeof navigator === "undefined" ? true : navigator.onLine);
  const ref = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setError("POOLS_OFFLINE");
      return;
    }
    ref.current?.abort();
    const abort = new AbortController();
    ref.current = abort;
    setLoading(true);
    try {
      setData(await fetchPools({ ...input, signal: abort.signal }));
      if (!abort.signal.aborted) setError(null);
    } catch (cause) {
      if (!abort.signal.aborted && !isAbortError(cause)) setError(safeClientErrorCode(cause, "POOLS_UNAVAILABLE"));
    } finally {
      if (!abort.signal.aborted) setLoading(false);
    }
  }, [input.chain, input.provider]);

  useEffect(() => {
    const update = () => {
      const next = navigator.onLine;
      setOnline(next);
      if (!next) {
        ref.current?.abort();
        setLoading(false);
        setError("POOLS_OFFLINE");
      }
    };
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    if (!online) return;
    void refresh();
    return () => ref.current?.abort();
  }, [online, refresh]);

  return { data, loading, error, online, refresh };
}
