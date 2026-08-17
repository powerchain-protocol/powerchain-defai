"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchPortfolio, type PortfolioData } from "@/lib/portfolio/fetch-portfolio";
import { isAbortError, safeClientErrorCode } from "@/utils/helpers";

const PORTFOLIO_STALE_AFTER_MS = 90_000;

export function usePortfolio(solanaAddress?: string | null, suiAddress?: string | null) {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [online, setOnline] = useState(() => typeof navigator === "undefined" ? true : navigator.onLine);
  const [now, setNow] = useState(() => Date.now());
  const dataRef = useRef<PortfolioData | null>(null);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const refresh = useCallback(async () => {
    if (!solanaAddress && !suiAddress) {
      controller.current?.abort();
      setData(null);
      setError(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setError("PORTFOLIO_OFFLINE");
      return;
    }

    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    const hasSnapshot = dataRef.current !== null;
    setLoading(!hasSnapshot);
    setRefreshing(hasSnapshot);

    try {
      const next = await fetchPortfolio({ solanaAddress, suiAddress, signal: abort.signal });
      if (abort.signal.aborted) return;
      setData(next);
      setNow(Date.now());
      setError(null);
    } catch (cause) {
      if (!abort.signal.aborted && !isAbortError(cause)) {
        setError(safeClientErrorCode(cause, "PORTFOLIO_UNAVAILABLE"));
      }
    } finally {
      if (!abort.signal.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [solanaAddress, suiAddress]);

  useEffect(() => {
    const update = () => {
      const next = navigator.onLine;
      setOnline(next);
      if (!next) {
        controller.current?.abort();
        setLoading(false);
        setRefreshing(false);
        setError("PORTFOLIO_OFFLINE");
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
    return () => controller.current?.abort();
  }, [online, refresh]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
      if (online && document.visibilityState === "visible") void refresh();
    }, 45_000);
    return () => window.clearInterval(timer);
  }, [online, refresh]);

  const checkedAt = data ? Date.parse(data.checkedAt) : Number.NaN;
  const stale = Boolean(data && (!Number.isFinite(checkedAt) || now - checkedAt > PORTFOLIO_STALE_AFTER_MS));
  return { data, loading, refreshing, error, online, stale, refresh };
}
