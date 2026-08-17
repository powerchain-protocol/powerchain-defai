"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Tabs } from "@/components/ui/tabs";
import { useProgramReadiness } from "@/hooks/use-program-readiness";
import type { ProgramRuntimeItem, ProgramRuntimeState } from "@/types/programs";

type Scope = "all" | "core" | "optional";

function short(value: string | undefined) { return value ? `${value.slice(0, 8)}…${value.slice(-6)}` : "Not configured"; }
function badge(state: ProgramRuntimeState) {
  if (state === "verified") return "border-[#bdcbc4] bg-[#edf4f0] text-[#244b3b] dark:border-[#35584a]/50 dark:bg-[#173b2d]/30 dark:text-[#d9e3de]";
  if (state === "unavailable") return "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200";
  if (state === "unconfigured") return "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300";
  return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200";
}
function label(state: ProgramRuntimeState) { return state.replaceAll("-", " "); }
function utcTime(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? `${date.toISOString().slice(11, 19)} UTC` : "Unknown";
}
function deploymentEvidenceLabel(item: ProgramRuntimeItem): string | undefined {
  const evidence = item.deploymentEvidence;
  if (!evidence) return undefined;
  if (evidence.kind === "solana-loader") return `${evidence.loader} · ${short(evidence.accountOwner)}`;
  return `Config ${evidence.configShared ? "shared" : "not shared"} · Information ${evidence.informationShared ? "shared" : "not shared"}`;
}

function ProgramCard({ item, refreshing, stale, onRefresh }: { item: ProgramRuntimeItem; refreshing: boolean; stale: boolean; onRefresh: () => void }) {
  return <article className="pc-panel rounded-[var(--pc-radius-panel)] p-5 sm:p-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[.14em] text-[#35584a] dark:text-[#adc0b6]">{item.chain} · {item.kind}</span>
          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.1em] ${badge(item.state)}`}>{label(item.state)}</span>
          {item.timedOut ? <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.1em] text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">Timed out</span> : null}
          {stale ? <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.1em] text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">Stale evidence</span> : null}
          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.1em] text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">{item.requiredForCoreBridge ? "Core required" : "Optional"}</span>
        </div>
        <h3 className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{item.label}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{item.purpose}</p>
      </div>
      <div className="flex shrink-0 flex-col gap-2 sm:items-end">
        <div className="grid min-w-48 grid-cols-2 gap-2 text-center">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-white/[0.03]"><p className="text-[10px] uppercase tracking-[.12em] text-slate-500">Verified</p><p className="mt-1 text-sm font-semibold">{item.verified ? "Yes" : "No"}</p></div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-white/[0.03]"><p className="text-[10px] uppercase tracking-[.12em] text-slate-500">Executable</p><p className="mt-1 text-sm font-semibold">{item.executable ? "Yes" : "No"}</p></div>
        </div>
        <Button size="sm" onClick={onRefresh} loading={refreshing} loadingLabel="Verifying…">Verify program</Button>
      </div>
    </div>
    <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
      <div className="rounded-xl border border-slate-200 p-3 dark:border-white/10"><dt className="text-xs text-slate-500">Runtime identifier</dt><dd className="mt-1 break-all font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">{short(item.identifier)}</dd></div>
      <div className="rounded-xl border border-slate-200 p-3 dark:border-white/10"><dt className="text-xs text-slate-500">Source</dt><dd className="mt-1 break-all font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">{item.sourcePath}</dd></div>
      <div className="rounded-xl border border-slate-200 p-3 dark:border-white/10"><dt className="text-xs text-slate-500">Custody</dt><dd className="mt-1 font-semibold text-slate-800 dark:text-slate-200">{item.custody}</dd></div>
      <div className="rounded-xl border border-slate-200 p-3 dark:border-white/10"><dt className="text-xs text-slate-500">Evidence</dt><dd className="mt-1 font-semibold text-slate-800 dark:text-slate-200">{item.evidenceSource} · {item.evidenceMode === "cache" ? `cached ${Math.round(item.cacheAgeMs / 1000)}s` : "live"}</dd></div>
      <div className="rounded-xl border border-slate-200 p-3 dark:border-white/10"><dt className="text-xs text-slate-500">Last checked</dt><dd className="mt-1 font-semibold text-slate-800 dark:text-slate-200">{utcTime(item.checkedAt)} · {item.verificationDurationMs} ms</dd></div>
      {item.configVersion ? <div className="rounded-xl border border-slate-200 p-3 dark:border-white/10"><dt className="text-xs text-slate-500">Config version</dt><dd className="mt-1 font-semibold text-slate-800 dark:text-slate-200">v{item.configVersion}</dd></div> : null}
      {deploymentEvidenceLabel(item) ? <div className="rounded-xl border border-slate-200 p-3 dark:border-white/10"><dt className="text-xs text-slate-500">Deployment evidence</dt><dd className="mt-1 break-words font-semibold text-slate-800 dark:text-slate-200">{deploymentEvidenceLabel(item)}</dd></div> : null}
    </dl>
    {stale ? <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">This evidence is older than the client freshness window. Verify this program again before relying on the displayed runtime state.</p> : null}
    {item.reason ? <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400">{item.reason}</p> : null}
  </article>;
}

export function ProtocolDashboard() {
  const runtime = useProgramReadiness();
  const [scope, setScope] = useState<Scope>("all");
  const programs = runtime.data?.programs ?? [];
  const visiblePrograms = useMemo(() => programs.filter((item) => scope === "all" || (scope === "core" ? item.requiredForCoreBridge : !item.requiredForCoreBridge)), [programs, scope]);

  return <div className="space-y-5">
    <section className="relative overflow-hidden rounded-[28px] border border-[#d5dfda] bg-[linear-gradient(135deg,#f8fbf9_0%,#eef5f1_60%,#e7f0eb_100%)] p-6 shadow-sm dark:border-[#284338] dark:bg-[linear-gradient(135deg,#0a110e_0%,#0d1712_55%,#102019_100%)] sm:p-8">
      <div className="absolute -right-20 -top-20 size-64 rounded-full bg-[#89a99a]/15 blur-3xl" aria-hidden="true"/>
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#35584a] dark:text-[#adc0b6]">Protocol runtime</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">Programs and contracts, verified at runtime.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">Source-controlled programs are not treated as deployed merely because they exist in the repository. This surface separates source identity, operator configuration and live RPC evidence.</p></div><Button variant="primary" onClick={() => void runtime.refresh(true)} disabled={!runtime.online} loading={runtime.refreshing} loadingLabel="Verifying…">Refresh all evidence</Button></div>
      <div className="relative mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-6"><div className="rounded-2xl border border-white/70 bg-white/70 p-4 backdrop-blur dark:border-white/10 dark:bg-black/20"><p className="text-xs text-slate-500">Core bridge readiness</p><p className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">{runtime.data ? `${runtime.data.requiredVerifiedCount}/${runtime.data.requiredCount}` : "—"}</p></div><div className="rounded-2xl border border-white/70 bg-white/70 p-4 backdrop-blur dark:border-white/10 dark:bg-black/20"><p className="text-xs text-slate-500">Configured</p><p className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">{runtime.data?.configuredCount ?? "—"}/{programs.length || "—"}</p></div><div className="rounded-2xl border border-white/70 bg-white/70 p-4 backdrop-blur dark:border-white/10 dark:bg-black/20"><p className="text-xs text-slate-500">RPC verified</p><p className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">{runtime.data?.verifiedCount ?? "—"}</p></div><div className="rounded-2xl border border-white/70 bg-white/70 p-4 backdrop-blur dark:border-white/10 dark:bg-black/20"><p className="text-xs text-slate-500">Executable now</p><p className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">{runtime.data?.executableCount ?? "—"}</p></div><div className="rounded-2xl border border-white/70 bg-white/70 p-4 backdrop-blur dark:border-white/10 dark:bg-black/20"><p className="text-xs text-slate-500">Unavailable</p><p className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">{runtime.data?.unavailableCount ?? "—"}</p></div><div className="rounded-2xl border border-white/70 bg-white/70 p-4 backdrop-blur dark:border-white/10 dark:bg-black/20"><p className="text-xs text-slate-500">Timed out</p><p className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">{runtime.data?.timedOutCount ?? "—"}</p></div></div>
    </section>

    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><Tabs value={scope} onValueChange={setScope} label="Program scope" items={[{ value: "all", label: "All" }, { value: "core", label: "Core" }, { value: "optional", label: "Optional" }] as const} className="w-full sm:w-auto sm:min-w-[310px]"/><p className="text-xs text-slate-500" aria-live="polite">{visiblePrograms.length} of {programs.length || 4} programs shown</p></div>

    {!runtime.online ? <InlineAlert tone="warning" title="Runtime verification paused">Browser is offline. Previously fetched evidence may become stale; no deployment state is inferred while disconnected.</InlineAlert> : null}
    {runtime.data && !runtime.coreEvidenceFresh ? <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">Core bridge evidence has aged beyond the {Math.round(runtime.staleAfterMs / 1000)} second client freshness window. Refresh runtime evidence before treating the page as current.</div> : null}
    {runtime.error ? <InlineAlert tone="warning" title="Program verification unavailable">Runtime evidence could not be refreshed. Retry when provider connectivity is healthy.</InlineAlert> : null}
    {runtime.data && !runtime.data.ready ? <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">Core bridge program readiness is incomplete. This page remains read-only and no source-controlled identifier is promoted to deployed status without fresh runtime evidence.</div> : null}
    {runtime.loading && !programs.length ? <div className="grid gap-4 lg:grid-cols-2">{[0,1,2,3].map((key)=><div key={key} className="h-64 animate-pulse rounded-[var(--pc-radius-panel)] border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-white/[0.04]"/>)}</div> : <section className="grid gap-4 lg:grid-cols-2">{visiblePrograms.map((item)=><ProgramCard key={item.id} item={item} refreshing={runtime.refreshingProgramId===item.id} stale={runtime.staleProgramIds.has(item.id)} onRefresh={()=>void runtime.refreshProgram(item.id)}/>)}</section>}
    <section className="grid gap-4 lg:grid-cols-3"><article className="pc-panel rounded-[var(--pc-radius-card)] p-5"><p className="text-xs font-semibold uppercase tracking-[.14em] text-slate-500">Bridge principal</p><h3 className="mt-2 font-semibold text-slate-950 dark:text-white">Wormhole NTT remains authoritative</h3><p className="mt-2 text-sm leading-6 text-slate-500">PowerChain Bridge programs record auxiliary intent and guard configuration. They do not mint, burn, lock or unlock bridge principal.</p></article><article className="pc-panel rounded-[var(--pc-radius-card)] p-5"><p className="text-xs font-semibold uppercase tracking-[.14em] text-slate-500">Signing</p><h3 className="mt-2 font-semibold text-slate-950 dark:text-white">Wallet authority stays explicit</h3><p className="mt-2 text-sm leading-6 text-slate-500">Staking and escrow state changes remain wallet-approved. This page is read-only and never becomes a signing or custody path.</p></article><article className="pc-panel rounded-[var(--pc-radius-card)] p-5"><p className="text-xs font-semibold uppercase tracking-[.14em] text-slate-500">Release rule</p><h3 className="mt-2 font-semibold text-slate-950 dark:text-white">Configured ≠ deployed</h3><p className="mt-2 text-sm leading-6 text-slate-500">Unset or unverified identifiers stay gated. Live readiness requires chain evidence and can fall back to unavailable when providers cannot prove deployment state.</p></article></section>
  </div>;
}
