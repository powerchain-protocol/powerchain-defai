"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { providerClient } from "@/backend/provider-client";
import type { ProviderDiagnosticChain, ProviderDiagnosticsPayload } from "@/types/providers";

function chainLabel(chain: "solana" | "sui") { return chain === "solana" ? "Solana" : "Sui"; }
function statusTone(status: ProviderDiagnosticChain["status"]) {
  if (status === "healthy") return "text-[#294a3b] dark:text-[#d0dcd6]";
  if (status === "degraded") return "text-amber-700 dark:text-amber-200";
  return "text-rose-700 dark:text-rose-300";
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-white/10 dark:bg-black/20"><dt className="text-[11px] text-slate-500">{label}</dt><dd className="mt-1 text-sm font-semibold tabular-nums text-slate-900 dark:text-white">{value}</dd></div>;
}

function ChainDiagnostics({ chain, data }: { chain: "solana" | "sui"; data: ProviderDiagnosticChain }) {
  const metrics = data.metrics;
  const readyEndpoints = data.endpoints.filter((endpoint) => endpoint.healthy && endpoint.circuit === "closed").length;
  return (
    <article className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-black/15">
      <div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-slate-950 dark:text-white">{chainLabel(chain)}</h3><span className={`text-xs font-semibold capitalize ${statusTone(data.status)}`}>{data.status}</span></div>
      <p className="mt-1 text-xs text-slate-500">{readyEndpoints}/{data.endpoints.length} endpoints ready{data.latencyMs === undefined ? "" : ` · ${data.latencyMs} ms probe`}</p>
      <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Metric label="Requests" value={metrics.requests} />
        <Metric label="Failovers" value={metrics.failovers} />
        <Metric label="Rate limited" value={metrics.rateLimited} />
        <Metric label="Cache hits" value={metrics.cacheHits + metrics.staleCacheHits} />
        <Metric label="Quorum checks" value={metrics.quorumChecks} />
        <Metric label="Quorum conflicts" value={metrics.quorumDisagreements} />
      </dl>
    </article>
  );
}

export function ProviderDiagnosticsCard() {
  const [data, setData] = useState<ProviderDiagnosticsPayload>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>();
  const controller = useRef<AbortController | null>(null);
  const generation = useRef(0);

  const refresh = useCallback(async (background = false) => {
    controller.current?.abort();
    const next = new AbortController();
    controller.current = next;
    const current = ++generation.current;
    if (background) setRefreshing(true); else setLoading(true);
    try {
      const value = await providerClient.diagnostics({ signal: next.signal });
      if (current !== generation.current) return;
      setData(value);
      setError(undefined);
    } catch (reason) {
      if (current !== generation.current || next.signal.aborted) return;
      setError(reason instanceof Error ? reason.message : "PROVIDER_DIAGNOSTICS_UNAVAILABLE");
    } finally {
      if (current === generation.current) { setLoading(false); setRefreshing(false); }
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible" && navigator.onLine) void refresh(true);
    }, 30_000);
    const online = () => void refresh(true);
    window.addEventListener("online", online);
    return () => {
      generation.current += 1;
      controller.current?.abort();
      window.clearInterval(interval);
      window.removeEventListener("online", online);
    };
  }, [refresh]);

  return (
    <section className="pc-cinematic-panel rounded-[26px] p-5 sm:p-6" aria-labelledby="provider-diagnostics-title" aria-busy={loading || refreshing}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Provider diagnostics</p><h2 id="provider-diagnostics-title" className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">RPC resilience counters</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">Process-local health, cache, failover and quorum counters from the active provider runtime. These counters are operational diagnostics, not settlement or accounting evidence.</p></div>
        <button type="button" onClick={() => void refresh(true)} disabled={loading || refreshing} className="pc-button-light min-h-10 rounded-xl px-4 text-xs font-semibold disabled:opacity-50">{refreshing ? "Checking…" : "Refresh"}</button>
      </div>
      {loading && !data ? <div className="mt-5 grid gap-3 lg:grid-cols-2" role="status"><div className="h-40 animate-pulse rounded-2xl bg-slate-100 dark:bg-white/[0.05]"/><div className="h-40 animate-pulse rounded-2xl bg-slate-100 dark:bg-white/[0.05]"/><span className="sr-only">Loading provider diagnostics…</span></div> : data ? <>
        <div className="mt-5 grid gap-3 lg:grid-cols-2"><ChainDiagnostics chain="solana" data={data.chains.solana}/><ChainDiagnostics chain="sui" data={data.chains.sui}/></div>
        <p className="mt-3 text-xs text-slate-500">Generated {new Date(data.generatedAt).toLocaleTimeString()} · process-local snapshot · accounting authority: no</p>
      </> : <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">Provider diagnostics are unavailable. Bridge execution remains governed by the separate readiness gate.</div>}
      {error && data ? <p className="mt-3 text-xs text-amber-700 dark:text-amber-200">Refresh failed; showing the last successful process-local snapshot.</p> : null}
    </section>
  );
}
