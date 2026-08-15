"use client";

import { useMemo, useState } from "react";
import { CopyAddress } from "./copy-address";
import { InlineAlert } from "../ui/inline-alert";
import { Skeleton } from "../ui/skeleton";

const DECIMALS = 9n;
const SCALE = 10n ** DECIMALS;

type Chain = "SOLANA" | "SUI";
type ApiEnvelope<T> = { data?: T; error?: { code?: string; message?: string } };

type CollectionPlan = {
  routeId: string;
  sourceChain: Chain;
  assetId: string;
  feeBps: number;
  recipient: string;
  principalBaseUnits: string;
  feeBaseUnits: string;
  totalSourceDebitBaseUnits: string;
  principalRule: string;
  signing: string;
};

function parsePwrc(value: string): bigint | null {
  const text = value.trim();
  if (!/^\d+(?:\.\d{0,9})?$/.test(text)) return null;
  const [whole, fraction = ""] = text.split(".");
  return BigInt(whole) * SCALE + BigInt((fraction + "000000000").slice(0, 9));
}

function formatUnits(raw: string): string {
  const value = BigInt(raw || "0");
  const whole = value / SCALE;
  const fraction = (value % SCALE).toString().padStart(9, "0").replace(/0+$/, "");
  const grouped = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return fraction ? `${grouped}.${fraction}` : grouped;
}

export function ServiceFeeEstimator() {
  const [routeId, setRouteId] = useState("");
  const [chain, setChain] = useState<Chain>("SOLANA");
  const [amount, setAmount] = useState("1000");
  const [plan, setPlan] = useState<CollectionPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const principal = useMemo(() => parsePwrc(amount), [amount]);
  const valid = Boolean(routeId.trim() && principal && principal > 0n);

  async function estimate() {
    if (!valid || !principal) return;
    setLoading(true);
    setError(null);
    setPlan(null);
    try {
      const qs = new URLSearchParams({ routeId: routeId.trim(), sourceChain: chain, principalBaseUnits: principal.toString() });
      const response = await fetch(`/api/v1/fees/collection-plan?${qs.toString()}`, { cache: "no-store", headers: { accept: "application/json" } });
      const payload = (await response.json()) as ApiEnvelope<CollectionPlan>;
      if (!response.ok || !payload.data) throw new Error(payload.error?.message || payload.error?.code || "Unable to load fee plan");
      setPlan(payload.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load fee plan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-950" aria-labelledby="fee-estimator-title">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">Service fee</p>
          <h2 id="fee-estimator-title" className="mt-1 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">Preview your exact source debit</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">The destination bridge principal remains 1:1. PowerChain service fees are a separate source-chain payment.</p>
        </div>
        <span className="mt-2 inline-flex w-fit rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 sm:mt-0 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">1:1 principal</span>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_180px_180px_auto] lg:items-end">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Route ID</span>
          <input value={routeId} onChange={(e) => setRouteId(e.target.value)} placeholder="Canonical route ID" autoComplete="off" className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Source chain</span>
          <select value={chain} onChange={(e) => setChain(e.target.value as Chain)} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
            <option value="SOLANA">Solana</option>
            <option value="SUI">Sui</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Principal PWRC</span>
          <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold tabular-nums text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
        </label>
        <button type="button" disabled={!valid || loading} onClick={estimate} className="h-11 rounded-xl bg-[#0B1730] px-5 text-sm font-semibold text-white transition hover:bg-[#122447] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-blue-600 dark:hover:bg-blue-500">{loading ? "Calculating…" : "Calculate fee"}</button>
      </div>

      {!valid && amount.length > 0 && principal === null ? <p className="mt-2 text-xs text-red-600">Enter a valid PWRC amount with up to 9 decimals.</p> : null}
      {error ? <div className="mt-4"><InlineAlert title="Fee plan unavailable" tone="warning">{error}</InlineAlert></div> : null}

      {loading ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-3"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
      ) : plan ? (
        <div className="mt-5 space-y-4" aria-live="polite">
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Bridge principal" value={`${formatUnits(plan.principalBaseUnits)} PWRC`} hint="Destination principal" />
            <Metric label={`Service fee · ${(plan.feeBps / 100).toFixed(2)}%`} value={`${formatUnits(plan.feeBaseUnits)} PWRC`} hint="Separate source payment" />
            <Metric label="Source token debit" value={`${formatUnits(plan.totalSourceDebitBaseUnits)} PWRC`} hint="Excludes native network gas" emphasize />
          </div>
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900/60">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Governed fee recipient</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Wallet-signed collection on {plan.sourceChain === "SOLANA" ? "Solana" : "Sui"}.</p>
            </div>
            <CopyAddress value={plan.recipient} label="service fee wallet" />
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Metric({ label, value, hint, emphasize = false }: { label: string; value: string; hint: string; emphasize?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${emphasize ? "border-blue-200 bg-blue-50/70 dark:border-blue-900 dark:bg-blue-950/25" : "border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/60"}`}>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold tracking-tight tabular-nums text-slate-950 dark:text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
    </div>
  );
}
