"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/lib/api/browser-api";
import { baseUnitsToDecimalString } from "@/lib/bridge/base-units";
import { BRIDGE_DIRECTIONS, parseBridgeDirection, parseBridgeTransferStatus } from "@/lib/data/data";
import { bridgeStatusRoute } from "@/config/app-routes";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button, buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

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

function statusTone(status: string): BadgeTone {
  const parsed = parseBridgeTransferStatus(status);
  if (parsed === "COMPLETED") return "success";
  if (parsed === "FAILED" || parsed === "RECONCILIATION_REQUIRED") return "danger";
  return "warning";
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
  const [updatedAt, setUpdatedAt] = useState<number | undefined>();
  const [now, setNow] = useState(() => Date.now());
  const activeController = useRef<AbortController | null>(null);

  const load = useCallback(async (background = false) => {
    if (background) setRefreshing(true); else setLoading(true);
    activeController.current?.abort();
    const controller = new AbortController();
    activeController.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 6_000);
    try {
      const response = await apiFetch("/api/v1/bridge/history?limit=5", { cache: "no-store", signal: controller.signal });
      const body: unknown = await response.json();
      if (!response.ok || !valid(body)) throw new Error("BRIDGE_HISTORY_UNAVAILABLE");
      setRows(body.data);
      setUpdatedAt(Date.now());
      setError(false);
    } catch (reason: unknown) {
      if (!(reason instanceof DOMException && reason.name === "AbortError")) setError(true);
    } finally {
      window.clearTimeout(timeout);
      if (!controller.signal.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
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

  const freshness = useMemo(
    () => updatedAt ? relativeTime(new Date(updatedAt).toISOString(), now) : null,
    [updatedAt, now],
  );

  return (
    <Card className="overflow-hidden" aria-labelledby="recent-transfers-title">
      <CardHeader className="flex-wrap items-center border-b border-slate-100 dark:border-white/10">
        <div>
          <h2 id="recent-transfers-title" className="text-sm font-semibold">Recent transfers</h2>
          <p className="mt-1 text-xs text-slate-500">
            Persisted bridge operations from the PowerChain database{freshness ? ` · updated ${freshness}` : ""}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => void load(true)} loading={refreshing || loading} loadingLabel="Refreshing…">Refresh</Button>
          <Link href="/history" className={buttonClassName({ variant: "primary", size: "sm" })}>View all</Link>
        </div>
      </CardHeader>

      {loading ? (
        <CardContent className="space-y-2 pt-4" role="status" aria-live="polite">
          <div className="h-14 animate-pulse rounded-[var(--pc-radius-control)] bg-slate-100 motion-reduce:animate-none dark:bg-white/[0.05]" />
          <div className="h-14 animate-pulse rounded-[var(--pc-radius-control)] bg-slate-100 motion-reduce:animate-none dark:bg-white/[0.05]" />
          <span className="sr-only">Loading recent transfers…</span>
        </CardContent>
      ) : error && rows.length === 0 ? (
        <CardContent className="pt-5">
          <EmptyState
            title="Transfer history unavailable"
            description="No transfer state was changed. Retry when the API is available."
            action={<Button variant="primary" onClick={() => void load()}>Try again</Button>}
          />
        </CardContent>
      ) : rows.length === 0 ? (
        <CardContent className="pt-5">
          <EmptyState title="No bridge transfers yet" description="Persisted bridge operations will appear here after a transfer is created." />
        </CardContent>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-white/10">
          {rows.map((row) => {
            const direction = parseBridgeDirection(row.direction) ?? "SUI_TO_SOLANA";
            const route = BRIDGE_DIRECTIONS[direction];
            const suiToSolana = direction === "SUI_TO_SOLANA";
            return (
              <Link
                key={row.id}
                href={bridgeStatusRoute(row.id)}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#557568] sm:px-5 dark:hover:bg-white/[0.035]"
              >
                <div className="relative">
                  <Image src={suiToSolana ? "/tokens/wpwrc.png" : "/tokens/pwrc.png"} alt="" width={38} height={38} className="size-9 rounded-full object-cover" />
                  <span className="absolute -bottom-0.5 -right-0.5 grid size-4 place-items-center rounded-full border border-white bg-[#1c4334] text-[8px] font-bold text-white dark:border-[#090d0b]" aria-hidden="true">→</span>
                </div>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold text-slate-900 dark:text-white">{route.label}</span>
                  <span className="mt-0.5 block font-mono text-[11px] tabular-nums text-slate-500">{baseUnitsToDecimalString(BigInt(row.principalBaseUnits), 9)} PWRC · {row.id.slice(0, 8)}…</span>
                </span>
                <span className="text-right">
                  <Badge tone={statusTone(row.status)}>{row.status.replaceAll("_", " ")}</Badge>
                  <time className="mt-1 block text-[10px] text-slate-400" dateTime={row.createdAt}>{relativeTime(row.createdAt, now)}</time>
                </span>
              </Link>
            );
          })}
        </div>
      )}

      {error && rows.length > 0 ? (
        <p className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-[11px] text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
          Showing the last successful transfer snapshot because refresh failed.
        </p>
      ) : null}
    </Card>
  );
}
