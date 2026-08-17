"use client";

import { useMemo } from "react";
import { CryptoAssetIcon } from "@/components/assets/crypto-asset-icon";
import { Card, CardContent, CardHeader, CardIcon } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DECIMALS = 9;
const AMOUNT = /^\d*(?:\.\d{0,9})?$/;

function formatCompactBaseUnits(value: bigint, decimals = DECIMALS): string {
  const scale = 10n ** BigInt(decimals);
  const whole = value / scale;
  const fraction = (value % scale).toString().padStart(decimals, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

export function AmountInputCard({
  value,
  onChange,
  symbol = "PWRC",
  balanceBaseUnits,
  disabled = false,
  minimumBaseUnits,
  maximumBaseUnits,
}: {
  value: string;
  onChange: (value: string) => void;
  symbol?: string;
  balanceBaseUnits?: bigint | null;
  disabled?: boolean;
  minimumBaseUnits?: bigint | null;
  maximumBaseUnits?: bigint | null;
}) {
  const validation = useMemo(() => {
    if (!value) return null;
    if (!AMOUNT.test(value)) return "Use up to 9 decimal places.";
    const [whole = "0", fraction = ""] = value.split(".");
    const units = BigInt(whole || "0") * 10n ** 9n + BigInt((fraction || "").padEnd(9, "0"));
    if (units <= 0n) return "Enter an amount greater than zero.";
    if (minimumBaseUnits != null && units < minimumBaseUnits) return `Minimum is ${formatCompactBaseUnits(minimumBaseUnits)} ${symbol}.`;
    if (maximumBaseUnits != null && units > maximumBaseUnits) return `Maximum is ${formatCompactBaseUnits(maximumBaseUnits)} ${symbol}.`;
    if (balanceBaseUnits != null && units > balanceBaseUnits) return "Amount exceeds your available balance.";
    return null;
  }, [value, minimumBaseUnits, maximumBaseUnits, balanceBaseUnits, symbol]);

  const available = balanceBaseUnits == null ? null : maximumBaseUnits != null && balanceBaseUnits > maximumBaseUnits ? maximumBaseUnits : balanceBaseUnits;
  const setFraction = (numerator: bigint, denominator: bigint) => {
    if (available == null || available <= 0n) return;
    const units = available * numerator / denominator;
    if (units > 0n) onChange(formatCompactBaseUnits(units));
  };

  return (
    <Card aria-labelledby="amount-input-title" className="overflow-hidden">
      <CardHeader className="items-center pb-3">
        <div className="flex min-w-0 items-center gap-3">
          <CardIcon className="size-11"><CryptoAssetIcon token={{ symbol }} size={28} /></CardIcon>
          <div className="min-w-0"><label id="amount-input-title" htmlFor="bridge-amount" className="block text-sm font-semibold">You bridge</label><p className="mt-0.5 truncate text-[11px] text-slate-500">Enter the source-chain principal</p></div>
        </div>
        <p className="text-right text-[11px] text-slate-500 dark:text-slate-400">Balance<br/><span className="font-semibold tabular-nums text-slate-700 dark:text-slate-200">{balanceBaseUnits == null ? "—" : `${formatCompactBaseUnits(balanceBaseUnits)} ${symbol}`}</span></p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className={`flex min-h-16 items-center gap-2 rounded-[var(--pc-radius-control)] border bg-slate-50/70 px-3 transition dark:bg-white/[.03] ${validation ? "border-red-300 dark:border-red-900" : "border-slate-200 focus-within:border-[#557568] focus-within:ring-2 focus-within:ring-[#35584a]/15 dark:border-white/10"}`}>
          <Input id="bridge-amount" inputMode="decimal" autoComplete="off" spellCheck={false} disabled={disabled} aria-invalid={Boolean(validation)} aria-describedby={validation ? "bridge-amount-error" : "bridge-amount-help"} placeholder="0.0" value={value} onChange={(event) => { const next = event.target.value.trim(); if (next === "" || AMOUNT.test(next)) onChange(next); }} className="min-w-0 flex-1 border-0 bg-transparent px-1 text-2xl font-semibold tracking-tight tabular-nums shadow-none focus:shadow-none" />
          <span className="shrink-0 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/[.05] dark:text-slate-100">{symbol}</span>
          <Button variant="ghost" size="sm" onClick={() => setFraction(1n, 1n)} disabled={disabled || available == null || available <= 0n} className="min-h-8 shrink-0 px-2 text-[#294a3b] dark:text-[#adc0b6]">MAX</Button>
        </div>
        <div className="mt-2 flex items-start justify-between gap-3">
          {validation ? <p id="bridge-amount-error" role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">{validation}</p> : <p id="bridge-amount-help" className="max-w-lg text-xs leading-5 text-slate-500 dark:text-slate-400">The destination principal remains 1:1. Service fee and network gas are shown separately before signing.</p>}
          <div className="flex shrink-0 gap-1" aria-label="Amount shortcuts">{[[1n,4n,"25%"],[1n,2n,"50%"]] .map(([n,d,label]) => <Button key={String(label)} variant="ghost" size="sm" onClick={() => setFraction(n as bigint,d as bigint)} disabled={disabled || available == null || available <= 0n} className="min-h-8 px-2 text-[11px] text-[#294a3b] dark:text-[#adc0b6]">{String(label)}</Button>)}</div>
        </div>
      </CardContent>
    </Card>
  );
}
