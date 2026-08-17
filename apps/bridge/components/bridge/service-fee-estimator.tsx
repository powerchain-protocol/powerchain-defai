"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/lib/api/browser-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { humanizeCode } from "@/utils/helpers";
import { CopyAddress } from "./copy-address";

const DECIMALS = 9n;
const SCALE = 10n ** DECIMALS;
const ROUTE_ID = /^[A-Za-z0-9._:-]{1,96}$/;

type Chain = "SOLANA" | "SUI";
type ApiEnvelope<T> = { data?: T; error?: { code?: string } };

type CollectionPlan = {
  routeId: string; sourceChain: Chain; assetId: string; feeBps: number; recipient: string;
  principalBaseUnits: string; feeBaseUnits: string; totalSourceDebitBaseUnits: string; principalRule: string; signing: string;
};

function parsePwrc(value: string): bigint | null {
  const text = value.trim();
  if (!/^\d+(?:\.\d{0,9})?$/.test(text)) return null;
  const [whole = "0", fraction = ""] = text.split(".");
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
  const requestRef = useRef<AbortController | null>(null);

  const principal = useMemo(() => parsePwrc(amount), [amount]);
  const normalizedRoute = routeId.trim();
  const routeValid = ROUTE_ID.test(normalizedRoute);
  const valid = Boolean(routeValid && principal && principal > 0n);

  useEffect(() => () => requestRef.current?.abort(), []);

  async function estimate() {
    if (!valid || !principal) return;
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true); setError(null); setPlan(null);
    try {
      const qs = new URLSearchParams({ routeId: normalizedRoute, sourceChain: chain, principalBaseUnits: principal.toString() });
      const response = await apiFetch(`/api/v1/fees/collection-plan?${qs.toString()}`, { cache: "no-store", signal: controller.signal, headers: { accept: "application/json" } });
      const payload = (await response.json()) as ApiEnvelope<CollectionPlan>;
      if (!response.ok || !payload.data) throw new Error(payload.error?.code || "FEE_PLAN_UNAVAILABLE");
      setPlan(payload.data);
    } catch (cause) {
      if (controller.signal.aborted) return;
      const code = cause instanceof Error && /^[A-Z][A-Z0-9:_-]{1,119}$/.test(cause.message) ? cause.message : "FEE_PLAN_UNAVAILABLE";
      setError(code === "FEE_PLAN_UNAVAILABLE" ? "Unable to load the governed fee plan. Try again after checking Runtime Status." : `${humanizeCode(code)}.`);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  return (
    <Card aria-labelledby="fee-estimator-title">
      <CardHeader>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#294a3b] dark:text-[#adc0b6]">Service fee</p>
          <CardTitle id="fee-estimator-title" className="mt-1 text-xl">Preview your exact source debit</CardTitle>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">The destination bridge principal remains 1:1. PowerChain service fees are a separate source-chain payment.</p>
        </div>
        <span className="inline-flex rounded-full border border-[#d4ddd8] bg-[#f1f4f2] px-2.5 py-1 text-xs font-semibold text-[#294a3b] dark:border-[#29483c] dark:bg-[#09110e]/60 dark:text-[#d0dcd6]">1:1 principal</span>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_auto] lg:items-end">
          <label><span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Route ID</span><Input value={routeId} maxLength={96} onChange={(event) => { setRouteId(event.target.value); setPlan(null); }} placeholder="Canonical route ID" autoComplete="off" spellCheck={false} aria-invalid={routeId.length > 0 && !routeValid} /></label>
          <label><span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Source chain</span><Select value={chain} onChange={(event) => { setChain(event.target.value as Chain); setPlan(null); }}><option value="SOLANA">Solana</option><option value="SUI">Sui</option></Select></label>
          <label><span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Principal PWRC</span><Input inputMode="decimal" value={amount} onChange={(event) => { setAmount(event.target.value); setPlan(null); }} aria-invalid={amount.length > 0 && principal === null} /></label>
          <Button variant="primary" disabled={!valid} loading={loading} loadingLabel="Calculating…" onClick={() => void estimate()}>Calculate fee</Button>
        </div>
        {routeId.length > 0 && !routeValid ? <p className="mt-2 text-xs text-rose-600 dark:text-rose-300">Route ID may contain letters, numbers, dots, colons, underscores and dashes.</p> : null}
        {amount.length > 0 && principal === null ? <p className="mt-2 text-xs text-rose-600 dark:text-rose-300">Enter a valid PWRC amount with up to 9 decimals.</p> : null}
        {error ? <div className="mt-4"><InlineAlert title="Fee plan unavailable" tone="warning">{error}</InlineAlert></div> : null}

        {loading ? <div className="mt-5 grid gap-3 sm:grid-cols-3"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div> : plan ? (
          <div className="mt-5 space-y-4" aria-live="polite">
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label="Bridge principal" value={`${formatUnits(plan.principalBaseUnits)} PWRC`} hint="Destination principal" />
              <Metric label={`Service fee · ${(plan.feeBps / 100).toFixed(2)}%`} value={`${formatUnits(plan.feeBaseUnits)} PWRC`} hint="Separate source payment" />
              <Metric label="Source token debit" value={`${formatUnits(plan.totalSourceDebitBaseUnits)} PWRC`} hint="Excludes native network gas" emphasize />
            </div>
            <div className="flex flex-col gap-3 rounded-[var(--pc-radius-control)] border border-slate-200/80 bg-slate-50/75 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/8 dark:bg-white/[.03]">
              <div><p className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-500">Governed fee recipient</p><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Wallet-signed collection on {plan.sourceChain === "SOLANA" ? "Solana" : "Sui"}.</p></div>
              <CopyAddress value={plan.recipient} label="service fee wallet" />
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, hint, emphasize = false }: { label: string; value: string; hint: string; emphasize?: boolean }) {
  return <div className={`rounded-[var(--pc-radius-control)] border p-4 ${emphasize ? "border-[#d4ddd8] bg-[#f1f4f2]/70 dark:border-[#29483c] dark:bg-[#09110e]/45" : "border-slate-200/80 bg-slate-50/75 dark:border-white/8 dark:bg-white/[.03]"}`}><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-1 text-lg font-semibold tracking-tight tabular-nums text-slate-950 dark:text-white">{value}</p><p className="mt-1 text-xs text-slate-500">{hint}</p></div>;
}
