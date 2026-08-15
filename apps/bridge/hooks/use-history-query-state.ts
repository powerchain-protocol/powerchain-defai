"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const MAX_QUERY_LENGTH = 96;
const ALLOWED_STATUS = new Set(["all", "in-progress", "completed", "attention"]);

function positiveInt(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function useHistoryQueryState(options: { defaultPageSize?: number; maxPageSize?: number } = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const defaultPageSize = Math.max(10, Math.min(100, options.defaultPageSize ?? 25));
  const maxPageSize = Math.max(defaultPageSize, Math.min(100, options.maxPageSize ?? 100));

  const state = useMemo(() => {
    const query = (params.get("q") || "").trim().slice(0, MAX_QUERY_LENGTH);
    const rawStatus = (params.get("status") || "all").toLowerCase();
    const status = ALLOWED_STATUS.has(rawStatus) ? rawStatus : "all";
    const page = positiveInt(params.get("page"), 1);
    const pageSize = Math.min(maxPageSize, positiveInt(params.get("pageSize"), defaultPageSize));
    return { query, status, page, pageSize };
  }, [params, defaultPageSize, maxPageSize]);

  const replace = useCallback((next: Partial<typeof state>, mode: "push" | "replace" = "push") => {
    const qs = new URLSearchParams(params.toString());
    const merged = { ...state, ...next };
    if (merged.query) qs.set("q", merged.query.slice(0, MAX_QUERY_LENGTH)); else qs.delete("q");
    if (merged.status !== "all") qs.set("status", merged.status); else qs.delete("status");
    if (merged.page > 1) qs.set("page", String(merged.page)); else qs.delete("page");
    if (merged.pageSize !== defaultPageSize) qs.set("pageSize", String(Math.min(maxPageSize, merged.pageSize))); else qs.delete("pageSize");
    const href = qs.size ? `${pathname}?${qs.toString()}` : pathname;
    router[mode](href, { scroll: false });
  }, [params, pathname, router, state, defaultPageSize, maxPageSize]);

  return {
    ...state,
    setQuery: (query: string) => replace({ query: query.trimStart().slice(0, MAX_QUERY_LENGTH), page: 1 }, "replace"),
    setStatus: (status: string) => replace({ status: ALLOWED_STATUS.has(status) ? status : "all", page: 1 }),
    setPage: (page: number) => replace({ page: Math.max(1, Math.floor(page)) }),
    setPageSize: (pageSize: number) => replace({ pageSize: Math.max(10, Math.min(maxPageSize, Math.floor(pageSize))), page: 1 }),
    clear: () => replace({ query: "", status: "all", page: 1, pageSize: defaultPageSize }, "replace"),
  };
}
