"use client";

import { usePwrcLiveData } from "@/hooks/use-pwrc-live-data";

type Props = { solanaOwner?: string; suiOwner?: string };
type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | null {
  return value != null && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : null;
}

function readEnvelopeData(root: JsonRecord, key: string): JsonRecord | null {
  const envelope = asRecord(root[key]);
  if (!envelope || envelope.ok !== true) return null;
  return asRecord(envelope.data);
}

function text(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "bigint") return value.toString();
  return "—";
}

export function LiveChainDataCard({ solanaOwner, suiOwner }: Props) {
  const { data, loading, error, refresh, updatedAt } = usePwrcLiveData(solanaOwner, suiOwner);
  const root = asRecord(data) ?? {};
  const solana = readEnvelopeData(root, "solana");
  const sui = readEnvelopeData(root, "sui");
  const market = readEnvelopeData(root, "market");

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950" aria-labelledby="live-chain-data-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="live-chain-data-title" className="text-sm font-semibold text-slate-950 dark:text-white">Live network data</h2>
          <p className="mt-1 text-xs text-slate-500">Finalized chain reads. Market price is informational only.</p>
        </div>
        <button type="button" onClick={() => void refresh()} disabled={loading} className="min-h-9 rounded-lg border border-slate-200 px-3 text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700">
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      {error ? <p role="alert" className="mt-3 text-sm text-amber-700 dark:text-amber-300">{error}</p> : null}
      <div className="mt-4 grid gap-3 sm:grid-cols-3" aria-busy={loading}>
        <Metric label="PWRC on Solana" value={text(solana?.balance ?? solana?.supply)} context={`slot ${text(solana?.balanceContextSlot ?? solana?.finalizedSlot)}`} />
        <Metric label="wPWRC on Sui" value={text(sui?.balance)} context={`checkpoint ${text(sui?.latestCheckpoint)}`} />
        <Metric label="PWRC / USD" value={market ? `$${text(market.price)}` : "Unavailable"} context={market ? `${text(market.source)} · market data` : "Configure Pyth/Birdeye"} />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] leading-4 text-slate-500">
        <p>Bridge completion and backing conservation use persisted, independently verified evidence.</p>
        {updatedAt ? <time dateTime={new Date(updatedAt).toISOString()}>Updated {new Date(updatedAt).toISOString().slice(11, 19)} UTC</time> : null}
      </div>
    </section>
  );
}

function Metric({ label, value, context }: { label: string; value: string; context: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 truncate font-mono text-sm tabular-nums" title={value}>{value}</p>
      <p className="mt-1 truncate text-[11px] text-slate-500" title={context}>{context}</p>
    </div>
  );
}
