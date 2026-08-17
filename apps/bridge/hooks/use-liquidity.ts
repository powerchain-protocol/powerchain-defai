"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchLiquidityPositions, type LiquidityPositions } from "@/lib/data/liquidity";
import { isAbortError, safeClientErrorCode } from "@/utils/helpers";

export function useLiquidity(solanaAddress?: string | null) {
  const [data, setData] = useState<LiquidityPositions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [online, setOnline] = useState(() => typeof navigator === "undefined" ? true : navigator.onLine);
  const ref = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    if (!solanaAddress) {
      ref.current?.abort();
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setError("LIQUIDITY_OFFLINE");
      return;
    }
    ref.current?.abort();
    const abort = new AbortController();
    ref.current = abort;
    setLoading(true);
    try {
      setData(await fetchLiquidityPositions(solanaAddress, abort.signal));
      if (!abort.signal.aborted) setError(null);
    } catch (cause) {
      if (!abort.signal.aborted && !isAbortError(cause)) setError(safeClientErrorCode(cause, "LIQUIDITY_POSITIONS_UNAVAILABLE"));
    } finally {
      if (!abort.signal.aborted) setLoading(false);
    }
  }, [solanaAddress]);

  useEffect(() => {
    const update = () => {
      const next = navigator.onLine;
      setOnline(next);
      if (!next) {
        ref.current?.abort();
        setLoading(false);
        setError("LIQUIDITY_OFFLINE");
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
