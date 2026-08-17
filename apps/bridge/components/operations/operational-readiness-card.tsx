"use client";
import { apiFetch } from "@/lib/api/browser-api";

import { useCallback, useEffect, useRef, useState } from "react";

type Worker = { type: string; ready: boolean; ageMs: number | null; heartbeatAt: string | null; version: string | null };
type Queue = { name: "bridge" | "claims" | "fees"; pending: number; attention: number; activeLeases: number; oldestPendingAgeMs: number | null; pressure: "normal" | "elevated" | "high" };
type Status = {
  state: "healthy" | "degraded" | "blocked";
  database: { ready: boolean };
  workers: { ready: boolean; maxAgeMs: number; workers: Worker[] };
  queues: Queue[];
  maintenance: { draining: boolean; activeLeases: number; quiescent: boolean; source: "environment-override" | "database" | "database-unavailable"; revision: number; readHealthy: boolean; checkedAt: string; lastSuccessfulReadAt: string | null; cacheAgeMs: number };
  checkedAt: string;
  authoritativeForBridgeAccounting: false;
};

function isStatus(value: unknown): value is Status {
  if (!value || typeof value !== "object") return false;
  const root = value as Record<string, unknown>;
  if (!(["healthy", "degraded", "blocked"] as unknown[]).includes(root.state)) return false;
  if (!root.database || typeof root.database !== "object" || typeof (root.database as Record<string, unknown>).ready !== "boolean") return false;
  if (!root.workers || typeof root.workers !== "object") return false;
  const workers = root.workers as Record<string, unknown>;
  if (typeof workers.ready !== "boolean" || typeof workers.maxAgeMs !== "number" || !Array.isArray(workers.workers)) return false;
  if (!Array.isArray(root.queues) || typeof root.checkedAt !== "string") return false;
  if (!root.maintenance || typeof root.maintenance !== "object") return false;
  const maintenance = root.maintenance as Record<string, unknown>;
  if (typeof maintenance.draining !== "boolean" || typeof maintenance.quiescent !== "boolean" || !Number.isInteger(maintenance.activeLeases)) return false;
  if (!["environment-override", "database", "database-unavailable"].includes(String(maintenance.source)) || !Number.isInteger(maintenance.revision) || typeof maintenance.readHealthy !== "boolean") return false;
  if (typeof maintenance.checkedAt !== "string" || !(maintenance.lastSuccessfulReadAt === null || typeof maintenance.lastSuccessfulReadAt === "string") || typeof maintenance.cacheAgeMs !== "number") return false;
  return root.queues.every((queue) => {
    if (!queue || typeof queue !== "object") return false;
    const item = queue as Record<string, unknown>;
    return ["bridge", "claims", "fees"].includes(String(item.name)) && typeof item.pending === "number" && typeof item.attention === "number" && typeof item.activeLeases === "number" && (item.oldestPendingAgeMs === null || typeof item.oldestPendingAgeMs === "number") && ["normal", "elevated", "high"].includes(String(item.pressure));
  });
}

function tone(state: Status["state"]) {
  if (state === "healthy") return "border-[#ced9d3] bg-[#f5f7f6] text-[#294a3b] dark:border-[#35584a]/30 dark:bg-[#29483c]/15 dark:text-[#d0dcd6]";
  if (state === "degraded") return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200";
  return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200";
}

export function OperationalReadinessCard() {
  const [status, setStatus] = useState<Status | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const controller = useRef<AbortController | null>(null);

  const load = useCallback(async (background = false) => {
    controller.current?.abort();
    const next = new AbortController();
    controller.current = next;
    if (background) setRefreshing(true); else setLoading(true);
    const timeout = window.setTimeout(() => next.abort(), 7_000);
    try {
      const response = await apiFetch("/api/v1/operations/status", { cache: "no-store", signal: next.signal });
      const body: unknown = await response.json();
      if (!isStatus(body)) throw new Error("INVALID_OPERATIONS_STATUS");
      setStatus(body);
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
    const interval = window.setInterval(() => { if (document.visibilityState === "visible" && navigator.onLine) void load(true); }, 30_000);
    return () => { controller.current?.abort(); window.clearInterval(interval); };
  }, [load]);

  return (
    <section className="pc-cinematic-panel rounded-[26px] p-5 sm:p-6" aria-labelledby="operations-readiness-title" aria-busy={refreshing}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Runtime operations</p><h2 id="operations-readiness-title" className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">Workers and queues</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">Evidence-based process readiness from persisted worker heartbeats and queue state. This surface is operational context, not settlement authority.</p></div>
        <button type="button" onClick={() => void load(true)} disabled={loading || refreshing} className="pc-button-light min-h-10 rounded-xl px-4 text-xs font-semibold disabled:opacity-50">{refreshing ? "Checking…" : "Refresh"}</button>
      </div>
      {loading ? <div className="mt-5 grid gap-3 sm:grid-cols-3" role="status"><div className="h-24 animate-pulse rounded-2xl bg-slate-100 dark:bg-white/[0.05]"/><div className="h-24 animate-pulse rounded-2xl bg-slate-100 dark:bg-white/[0.05]"/><div className="h-24 animate-pulse rounded-2xl bg-slate-100 dark:bg-white/[0.05]"/><span className="sr-only">Loading operational readiness…</span></div> : status ? <>
        <div className="mt-5 flex flex-wrap items-center gap-2"><span className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${tone(status.state)}`}>{status.state}</span>{status.maintenance.draining ? <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">{status.maintenance.quiescent ? "Drain complete" : `Draining · ${status.maintenance.activeLeases} leased`}</span> : null}{!status.maintenance.readHealthy ? <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">Maintenance control unavailable</span> : null}<span className="text-xs text-slate-500">Database {status.database.ready ? "ready" : "unavailable"} · maintenance r{status.maintenance.revision} via {status.maintenance.source} · checked {new Date(status.checkedAt).toLocaleTimeString()}</span></div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white/65 p-4 dark:border-white/10 dark:bg-black/15"><h3 className="text-sm font-semibold text-slate-950 dark:text-white">Worker heartbeats</h3><div className="mt-3 space-y-2">{status.workers.workers.length ? status.workers.workers.map((worker) => <div key={worker.type} className="flex items-center justify-between gap-3 text-sm"><span className="capitalize text-slate-600 dark:text-slate-300">{worker.type}</span><span className={worker.ready ? "text-[#294a3b] dark:text-[#adc0b6]" : "text-rose-600 dark:text-rose-300"}>{worker.ready ? "Ready" : "Stale"}{worker.ageMs !== null ? ` · ${Math.round(worker.ageMs / 1000)}s` : ""}</span></div>) : <p className="text-sm text-slate-500">No worker heartbeat data available.</p>}</div></div>
          <div className="rounded-2xl border border-slate-200 bg-white/65 p-4 dark:border-white/10 dark:bg-black/15"><h3 className="text-sm font-semibold text-slate-950 dark:text-white">Queue snapshot</h3><div className="mt-3 space-y-2">{status.queues.length ? status.queues.map((queue) => <div key={queue.name} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 text-sm"><span className="capitalize text-slate-600 dark:text-slate-300">{queue.name}</span><span className="tabular-nums text-slate-500">{queue.pending} pending · {queue.activeLeases} leased · {queue.pressure}{queue.oldestPendingAgeMs !== null ? ` · oldest ${Math.max(1, Math.round(queue.oldestPendingAgeMs / 60000))}m` : ""}</span><span className={queue.attention > 0 ? "tabular-nums text-rose-600 dark:text-rose-300" : "tabular-nums text-slate-400"}>{queue.attention} attention</span></div>) : <p className="text-sm text-slate-500">Queue counts unavailable while the database is offline.</p>}</div></div>
        </div>
      </> : <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">Operational readiness is currently unavailable. No settlement state has been changed.</div>}
      {error && status ? <p className="mt-3 text-xs text-amber-700 dark:text-amber-200">Refresh failed; showing the last successful operational snapshot.</p> : null}
    </section>
  );
}
