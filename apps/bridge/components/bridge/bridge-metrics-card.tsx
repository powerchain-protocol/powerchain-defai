"use client";
import { apiFetch } from "@/lib/api/browser-api";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { baseUnitsToDecimalString } from "@/lib/bridge/base-units";
import { BRIDGE_DIRECTIONS, isBridgeMetricsPayload, type BridgeMetricsPayload } from "@/lib/data/data";

const WINDOWS = [
  { label: "24h", hours: 24 },
  { label: "7d", hours: 24 * 7 },
  { label: "30d", hours: 24 * 30 },
] as const;

type MetricsWindowHours = (typeof WINDOWS)[number]["hours"];

function compactNumber(value: number): string {
  return new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function durationLabel(value: number | null): string {
  if (value === null) return "—";
  if (value < 60_000) return `${Math.max(1, Math.round(value / 1_000))}s`;
  if (value < 3_600_000) return `${Math.round(value / 60_000)}m`;
  return `${(value / 3_600_000).toFixed(1)}h`;
}

function percentLabel(bps: number | null): string {
  return bps === null ? "—" : `${(bps / 100).toFixed(bps % 100 === 0 ? 0 : 1)}%`;
}

function freshnessLabel(value: string): string {
  const ageMs = Date.now() - Date.parse(value);
  if (!Number.isFinite(ageMs) || ageMs < 0) return "Updated now";
  if (ageMs < 60_000) return `Updated ${Math.max(1, Math.round(ageMs / 1_000))}s ago`;
  return `Updated ${Math.round(ageMs / 60_000)}m ago`;
}

function windowLabel(hours: number): string {
  if (hours === 24) return "24 hours";
  if (hours === 168) return "7 days";
  return "30 days";
}

export function BridgeMetricsCard() {
  const [data, setData] = useState<BridgeMetricsPayload | undefined>(undefined);
  const [windowHours, setWindowHours] = useState<MetricsWindowHours>(24);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [online, setOnline] = useState(true);
  const [clock, setClock] = useState(0);
  const controller = useRef<AbortController | null>(null);

  const load = useCallback(async (hours: MetricsWindowHours = windowHours) => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setOnline(false);
      setLoading(false);
      return;
    }

    controller.current?.abort();
    const next = new AbortController();
    controller.current = next;
    setLoading(true);
    const timeout = window.setTimeout(() => next.abort(), 8_000);

    try {
      const response = await apiFetch(`/api/v1/metrics/bridge?windowHours=${hours}`, { cache: "no-store", signal: next.signal });
      const body: unknown = await response.json();
      if (!response.ok || !isBridgeMetricsPayload(body)) throw new Error("Invalid metrics response");
      setData(body);
      setError(false);
      setOnline(true);
    } catch (reason: unknown) {
      if (!(reason instanceof DOMException && reason.name === "AbortError" && controller.current !== next)) setError(true);
    } finally {
      window.clearTimeout(timeout);
      if (controller.current === next) setLoading(false);
    }
  }, [windowHours]);

  useEffect(() => {
    setOnline(navigator.onLine);
    void load(windowHours);
    const refreshTimer = window.setInterval(() => {
      if (document.visibilityState === "visible" && navigator.onLine) void load(windowHours);
    }, 60_000);
    const clockTimer = window.setInterval(() => setClock((value) => value + 1), 30_000);
    const handleOnline = () => {
      setOnline(true);
      void load(windowHours);
    };
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      controller.current?.abort();
      window.clearInterval(refreshTimer);
      window.clearInterval(clockTimer);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [load, windowHours]);

  const completedPrincipal = useMemo(() => {
    if (!data) return "—";
    return `${baseUnitsToDecimalString(BigInt(data.principal.completedInWindowBaseUnits), 9)} PWRC`;
  }, [data]);

  const directionTotal = data ? data.transfers.suiToSolanaInWindow + data.transfers.solanaToSuiInWindow : 0;
  const suiShare = data && directionTotal > 0 ? Math.round((data.transfers.suiToSolanaInWindow * 100) / directionTotal) : 0;
  const freshness = data ? freshnessLabel(data.generatedAt) : null;
  void clock;

  return (
    <section className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-white/10 dark:bg-[#090d0b]" aria-labelledby="bridge-metrics-title" aria-busy={loading}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#294a3b] dark:text-[#d0dcd6]">Persisted activity</p>
          <h2 id="bridge-metrics-title" className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">Bridge metrics</h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">Operational summaries from persisted bridge records. No synthetic TVL, TPS, or volume estimates. No synthetic uptime is shown.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-white/10 dark:bg-white/[0.03]" aria-label="Metrics time window">
            {WINDOWS.map((item) => (
              <button
                key={item.hours}
                type="button"
                onClick={() => {
                  if (item.hours === windowHours) return;
                  setWindowHours(item.hours);
                }}
                aria-pressed={windowHours === item.hours}
                className={`min-h-8 rounded-lg px-2.5 text-[11px] font-semibold transition ${windowHours === item.hours ? "bg-slate-950 text-white dark:bg-[#365f4f] dark:text-[#07100d]" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => void load()} disabled={loading || !online} className="min-h-9 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:border-[#9eafa7] hover:text-[#264b3b] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-slate-300 dark:hover:text-[#d9e3de]">{!online ? "Offline" : loading ? "Checking…" : "Refresh"}</button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400" aria-live="polite">
        <span>Window: {windowLabel(windowHours)}</span>
        {freshness ? <span>{freshness}</span> : null}
        {!online ? <span className="font-medium text-amber-700 dark:text-amber-300">Offline · showing last persisted snapshot</span> : null}
      </div>

      {loading && !data ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" role="status"><span className="sr-only">Loading bridge metrics…</span>{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-20 animate-pulse rounded-2xl bg-slate-100 dark:bg-white/[0.05]" />)}</div>
      ) : data ? (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Total transfers" value={compactNumber(data.transfers.total)} detail={`${data.transfers.active} active`} />
            <Metric label={`Completed · ${windowHours === 24 ? "24h" : windowHours === 168 ? "7d" : "30d"}`} value={compactNumber(data.transfers.completedInWindow)} detail={`${data.transfers.createdInWindow} created`} />
            <Metric label="Terminal completion" value={percentLabel(data.transfers.terminalCompletionRateBps)} detail={`${data.transfers.completed + data.transfers.failed} terminal operations`} />
            <Metric label="Median operation time" value={durationLabel(data.timing.medianOperationDurationMs)} detail={`${data.timing.completedSampleSize} completed sample`} />
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,.85fr)]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-[#070b09]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold text-slate-500">Route activity · selected window</p>
                  <p className="mt-1 text-xs text-slate-400">Created transfer count by canonical bridge direction.</p>
                </div>
                <span className="text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-200">{compactNumber(directionTotal)}</span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10" aria-hidden="true">
                <div className="h-full rounded-full bg-[#1c4334] transition-[width]" style={{ width: `${suiShare}%` }} />
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <DirectionRow label={BRIDGE_DIRECTIONS.SUI_TO_SOLANA.shortLabel} value={data.transfers.suiToSolanaInWindow} share={directionTotal > 0 ? suiShare : null} />
                <DirectionRow label={BRIDGE_DIRECTIONS.SOLANA_TO_SUI.shortLabel} value={data.transfers.solanaToSuiInWindow} share={directionTotal > 0 ? 100 - suiShare : null} />
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <Metric label="Completed principal" value={completedPrincipal} detail="selected window" />
                <Metric label="Needs reconciliation" value={compactNumber(data.transfers.reconciliationRequired)} detail="current all-time state" />
                <Metric label="Failed" value={compactNumber(data.transfers.failed)} detail="current all-time state" />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#090d0b]">
              <p className="text-[11px] font-semibold text-slate-500">Lifecycle timing · selected window</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">Observed from persisted lifecycle timestamps; missing stages are excluded.</p>
              <div className="mt-4 space-y-3">
                <TimingRow label="Source finality" value={data.timing.sourceFinality.medianMs} sample={data.timing.sourceFinality.sampleSize} />
                <TimingRow label="NTT observation" value={data.timing.messageObservation.medianMs} sample={data.timing.messageObservation.sampleSize} />
                <TimingRow label="Destination finality" value={data.timing.destinationFinality.medianMs} sample={data.timing.destinationFinality.sampleSize} />
              </div>
            </div>
          </div>

          <p className="mt-3 text-[11px] leading-5 text-slate-500">Metrics are operational summaries, not accounting evidence. Transfer completion remains authoritative only after persisted finality and reconciliation checks.</p>
        </>
      ) : (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10"><p className="text-xs text-amber-800 dark:text-amber-200">Bridge metrics are temporarily unavailable. No transfer state was changed.</p><button type="button" onClick={() => void load()} disabled={!online} className="min-h-9 rounded-xl bg-slate-950 px-3 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#1c4334] dark:text-[#07100d]">{online ? "Try again" : "Offline"}</button></div>
      )}
      {error && data ? <p className="mt-3 text-[11px] text-amber-700 dark:text-amber-200">Showing the last successful persisted metrics snapshot because refresh failed.</p> : null}
    </section>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-[#090d0b]"><p className="text-[11px] text-slate-500">{label}</p><p className="mt-1 truncate text-lg font-semibold tabular-nums text-slate-950 dark:text-white" title={value}>{value}</p>{detail ? <p className="mt-1 text-[10px] text-slate-400">{detail}</p> : null}</div>;
}

function DirectionRow({ label, value, share }: { label: string; value: number; share: number | null }) {
  return <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-xs dark:bg-white/[0.035]"><span className="font-medium text-slate-600 dark:text-slate-300">{label}</span><span className="tabular-nums text-slate-500 dark:text-slate-400">{value}{share === null ? "" : ` · ${share}%`}</span></div>;
}

function TimingRow({ label, value, sample }: { label: string; value: number | null; sample: number }) {
  return <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-medium text-slate-700 dark:text-slate-200">{label}</p><p className="mt-0.5 text-[10px] text-slate-400">{sample} observed stage{sample === 1 ? "" : "s"}</p></div><span className="text-sm font-semibold tabular-nums text-slate-950 dark:text-white">{durationLabel(value)}</span></div>;
}
