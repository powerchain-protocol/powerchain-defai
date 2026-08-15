"use client";

import { useEffect, useState } from "react";
import type { HistoryStatus } from "@/components/bridge/history-toolbar";

const KEY = "powerchain.bridge.history-filters.v1";

export function useHistoryFilters(defaultStatus: HistoryStatus = "ALL") {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<HistoryStatus>(defaultStatus);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { query?: unknown; status?: unknown };
      if (typeof parsed.query === "string") setQuery(parsed.query.slice(0, 160));
      if (["ALL", "IN_PROGRESS", "COMPLETED", "FAILED"].includes(String(parsed.status))) setStatus(parsed.status as HistoryStatus);
    } catch {}
  }, []);

  useEffect(() => {
    try { sessionStorage.setItem(KEY, JSON.stringify({ query, status })); } catch {}
  }, [query, status]);

  return { query, status, setQuery, setStatus, clear: () => { setQuery(""); setStatus(defaultStatus); } };
}
