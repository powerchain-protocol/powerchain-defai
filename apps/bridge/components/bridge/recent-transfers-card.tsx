"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { baseUnitsToDecimalString } from "@/lib/bridge/base-units";
import { BRIDGE_DIRECTIONS, parseBridgeDirection, parseBridgeTransferStatus } from "@/lib/data/data";

type Transfer = { id: string; direction: string; status: string; principalBaseUnits: string; createdAt: string };
type HistoryResponse = { data: Transfer[] };

function valid(value: unknown): value is HistoryResponse {
  if (!value || typeof value !== "object") return false;
  const root = value as Record<string, unknown>;
  return Array.isArray(root.data) && root.data.every((row) => {
    if (!row || typeof row !== "object") return false;
    const item = row as Record<string, unknown>;
    return typeof item.id === "string"
      && typeof item.direction === "string"
      && typeof item.status === "string"
      && typeof item.principalBaseUnits === "string"
      && /^\d+$/.test(item.principalBaseUnits)
      && typeof item.createdAt === "string"
      && Number.isFinite(Date.parse(item.createdAt));
  });
}

function statusTone(status: string) {
  const parsed = parseBridgeTransferStatus(status);
  if (parsed === "COMPLETED") return "border-[#d4ddd8] bg-[#f1f4f2] text-[#294a3b] dark:border-[#35584a]/20 dark:bg-[#29483c]/18 dark:text-[#d0dcd6]";
  if (parsed === "FAILED" || parsed === "RECONCILIATION_REQUIRED") return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300";
  return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200";
}

function relativeTime(iso: string, now: number) {
  const deltaMs = Date.parse(iso) - now;
  const abs = Math.abs(deltaMs);
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  if (abs < 60_000) return formatter.format(Math.round(deltaMs / 1_000), "second");
  if (abs < 3_600_000) return formatter.format(Math.round(deltaMs / 60_000), "minute");
  if (abs < 86_400_000) return formatter.format(Math.round(deltaMs / 3_600_000), "hour");
  return formatter.format(Math.round(deltaMs / 86_400_000), "day");
}

export function RecentTransfersCard() {
  const [rows, setRows] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<number | undefined>(undefined);
  const [now, setNow] = useState(() => Date.now());
  const activeController = useRef<AbortController | null>(null);

  const load = useCallback(async (background = false) => {
    if (background) setRefreshing(true); else setLoading(true);
    activeController.current?.abort();
    const controller = new AbortController();
    activeController.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 6_000);
    try {
      const response = await fetch("/api/v1/bridge/history?limit=5", { cache: "no-store", signal: controller.signal });
      const body: unknown = await response.json();
      if (!response.ok || !valid(body)) throw new Error("History unavailable");
      setRows(body.data);
      setUpdatedAt(Date.now());
      setError(false);
    } catch (reason: unknown) {
      if (!(reason instanceof DOMException && reason.name === "AbortError")) setError(true);
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => {
      setNow(Date.now());
      if (document.visibilityState === "visible" && navigator.onLine) void load(true);
    }, 30_000);
    return () => {
      activeController.current?.abort();
      window.clearInterval(timer);
    };
  }, [load]);

  const freshness = useMemo(() => updatedAt ? relativeTime(new Date(updatedAt).toISOString(), now) : null, [updatedAt, now]);

  return (
    <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#090d0b]" aria-labelledby="recent-transfers-title">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5 dark:border-white/10">
        <div>
          <h2 id="recent-transfers-title" className="text-sm font-semibold text-slate-950 dark:text-white">Recent transfers</h2>
          <p className="mt-1 text-xs text-slate-500">Persisted bridge operations from the PowerChain database{freshness ? ` · updated ${freshness}` : ""}.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => void load(true)} disabled={refreshing || loading} className="min-h-9 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:border-[#9eafa7] hover:text-[#264b3b] disabled:opacity-50 dark:border-white/10 dark:text-slate-300 dark:hover:border-[#35584a]/30 dark:hover:text-[#d9e3de]">{refreshing ? "Refreshing…" : "Refresh"}</button>
          <Link href="/history" className="min-h-9 rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#102b21] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] dark:bg-[#1c4334] dark:text-[#07100d] dark:hover:bg-[#365f4f]">View all</Link>
        </div>
      </div>
      {loading ? (
        <div className="space-y-2 p-4" role="status" aria-live="polite"><div className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-white/[0.05]" /><div className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-white/[0.05]" /><span className="sr-only">Loading recent transfers…</span></div>
      ) : error && rows.length === 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 p-5"><div><p className="text-sm font-semibold text-slate-900 dark:text-white">Transfer history unavailable</p><p className="mt-1 text-xs text-slate-500">No transfer state was changed. Retry when the API is available.</p></div><button type="button" onClick={() => void load()} className="min-h-10 rounded-xl bg-slate-950 px-4 text-xs font-semibold text-white dark:bg-[#1c4334] dark:text-[#07100d]">Try again</button></div>
      ) : rows.length === 0 ? (
        <div className="p-5 text-sm text-slate-500">No bridge transfers have been persisted yet.</div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-white/10">{rows.map((row) => {
          const direction = parseBridgeDirection(row.direction) ?? "SUI_TO_SOLANA";
          const route = BRIDGE_DIRECTIONS[direction];
          const suiToSolana = direction === "SUI_TO_SOLANA";
          return <Link key={row.id} href={`/bridge/status/${encodeURIComponent(row.id)}`} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#35584a] sm:px-5 dark:hover:bg-white/[0.035]">
            <div className="relative"><Image src={suiToSolana ? "/tokens/wpwrc.png" : "/tokens/pwrc.png"} alt="" width={38} height={38} className="size-9 rounded-full object-cover" /><span className="absolute -bottom-0.5 -right-0.5 grid size-4 place-items-center rounded-full border border-white bg-[#1c4334] text-[8px] font-bold text-[#07100d] dark:border-[#090d0b]" aria-hidden="true">→</span></div>
            <span className="min-w-0"><span className="block truncate text-xs font-semibold text-slate-900 dark:text-white">{route.label}</span><span className="mt-0.5 block font-mono text-[11px] tabular-nums text-slate-500">{baseUnitsToDecimalString(BigInt(row.principalBaseUnits), 9)} PWRC · {row.id.slice(0, 8)}…</span></span>
            <span className="text-right"><span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold ${statusTone(row.status)}`}>{row.status.replaceAll("_", " ")}</span><time className="mt-1 block text-[10px] text-slate-400" dateTime={row.createdAt}>{relativeTime(row.createdAt, now)}</time></span>
          </Link>;
        })}</div>
      )}
      {error && rows.length > 0 ? <p className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-[11px] text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">Showing the last successful transfer snapshot because refresh failed.</p> : null}
    </section>
  );
}
