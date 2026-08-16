"use client";

import { useMemo } from "react";

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
  const setMax = () => setFraction(1n, 1n);

  return (
    <section className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950" aria-labelledby="amount-input-title">
      <div className="flex items-center justify-between gap-3">
        <label id="amount-input-title" htmlFor="bridge-amount" className="text-sm font-semibold text-slate-950 dark:text-white">You bridge</label>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Balance: <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-200">{balanceBaseUnits == null ? "—" : `${formatCompactBaseUnits(balanceBaseUnits)} ${symbol}`}</span>
        </p>
      </div>
      <div className={`mt-3 flex min-h-16 items-center gap-3 rounded-2xl border px-4 transition ${validation ? "border-red-300 bg-red-50/30 dark:border-red-900 dark:bg-red-950/10" : "border-slate-300 focus-within:border-[#557568] focus-within:ring-2 focus-within:ring-[#35584a]/15 dark:border-slate-700"}`}>
        <input
          id="bridge-amount"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
          aria-invalid={Boolean(validation)}
          aria-describedby={validation ? "bridge-amount-error" : "bridge-amount-help"}
          placeholder="0.0"
          value={value}
          onChange={(event) => {
            const next = event.target.value.trim();
            if (next === "" || AMOUNT.test(next)) onChange(next);
          }}
          className="min-w-0 flex-1 bg-transparent text-2xl font-semibold tracking-tight tabular-nums text-slate-950 outline-none placeholder:text-slate-300 disabled:cursor-not-allowed disabled:opacity-60 dark:text-white dark:placeholder:text-slate-700"
        />
        <span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1.5 text-sm font-semibold text-slate-800 dark:bg-slate-900 dark:text-slate-100">{symbol}</span>
        <button type="button" onClick={setMax} disabled={disabled || balanceBaseUnits == null || balanceBaseUnits <= 0n} className="shrink-0 rounded-lg px-2 py-1.5 text-xs font-bold text-[#294a3b] transition hover:bg-[#f1f4f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] disabled:opacity-40 dark:text-[#adc0b6] dark:hover:bg-[#09110e]/60">MAX</button>
      </div>
      <div className="mt-2 flex items-start justify-between gap-3">
        {validation ? <p id="bridge-amount-error" role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">{validation}</p> : <p id="bridge-amount-help" className="text-xs text-slate-500 dark:text-slate-400">The destination principal remains 1:1. Service fee and network gas are shown separately before signing.</p>}
        <div className="flex shrink-0 gap-1" aria-label="Amount shortcuts">{[[1n,4n,"25%"],[1n,2n,"50%"]] .map(([n,d,label]) => <button key={String(label)} type="button" onClick={() => setFraction(n as bigint,d as bigint)} disabled={disabled || available == null || available <= 0n} className="min-h-8 rounded-lg px-2 text-[11px] font-bold text-[#294a3b] hover:bg-[#f1f4f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] disabled:opacity-40 dark:text-[#adc0b6] dark:hover:bg-[#09110e]/60">{String(label)}</button>)}</div>
      </div>
    </section>
  );
}
