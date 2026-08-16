import Link from "next/link";
import { BRIDGE_HISTORY_STATUSES, listBridgeTransactions, parseBridgeHistoryStatus } from "@powerchain/backend/services/transactions";
import { PageHeader } from "@/components/ui/page-header";
import { baseUnitsToDecimalString } from "@/lib/bridge/base-units";

export const dynamic = "force-dynamic";

type HistoryStatus = (typeof BRIDGE_HISTORY_STATUSES)[number];

function safe(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function formatStatus(value: string): string {
  return value.replaceAll("_", " ");
}

function statusTone(value: string): string {
  if (value === "COMPLETED") return "bg-[#f1f4f2] text-[#294a3b] ring-[#d4ddd8] dark:bg-[#09110e]/60 dark:text-[#d0dcd6] dark:ring-[#29483c]";
  if (value === "FAILED" || value === "RECONCILIATION_REQUIRED") return "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900";
  if (value.includes("FINALIZED") || value === "MESSAGE_OBSERVED") return "bg-[#f1f4f2] text-[#294a3b] ring-[#d4ddd8] dark:bg-[#09110e]/60 dark:text-[#d0dcd6] dark:ring-[#29483c]";
  return "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800";
}

function summary(rows: Array<{ status: HistoryStatus }>) {
  return {
    completed: rows.filter((row) => row.status === "COMPLETED").length,
    active: rows.filter((row) => !["COMPLETED", "FAILED", "RECONCILIATION_REQUIRED"].includes(row.status)).length,
    attention: rows.filter((row) => row.status === "FAILED" || row.status === "RECONCILIATION_REQUIRED").length,
  };
}

export default async function HistoryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const search = await searchParams;
  const address = safe(search.address).trim();
  const requestedStatus = safe(search.status);
  const status = parseBridgeHistoryStatus(requestedStatus);
  const invalidStatus = Boolean(requestedStatus.trim()) && status === null;
  const page = await listBridgeTransactions({ address, status, limit: 50 });
  const rows = page.data;
  const counts = summary(rows);

  return (
    <main className="mx-auto max-w-6xl space-y-5">
      <PageHeader eyebrow="PowerChain DeFAI" title="Transaction history" description="Persisted bridge operations from the canonical backend transaction service. Explorer visibility remains context; finality and reconciliation remain authoritative." />
      <section className="grid gap-3 sm:grid-cols-3" aria-label="Current history page summary">
        <SummaryCard label="Active" value={counts.active} detail="In progress on this page" />
        <SummaryCard label="Completed" value={counts.completed} detail="Reconciled on this page" />
        <SummaryCard label="Needs attention" value={counts.attention} detail="Failed or reconciliation required" tone={counts.attention > 0 ? "attention" : "default"} />
      </section>
      <form className="pc-glass grid gap-2 rounded-2xl p-4 sm:grid-cols-[1fr_220px_auto]" role="search">
        <label className="sr-only" htmlFor="history-address">Wallet address</label>
        <input id="history-address" name="address" defaultValue={address} placeholder="Wallet address" autoComplete="off" spellCheck={false} className="min-h-11 rounded-xl border border-slate-300 bg-white/70 px-3 text-sm focus-visible:border-[#557568] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a]/20 dark:border-white/10 dark:bg-black/20" />
        <label className="sr-only" htmlFor="history-status">Transfer status</label>
        <select id="history-status" name="status" defaultValue={status ?? ""} className="min-h-11 rounded-xl border border-slate-300 bg-white/70 px-3 text-sm focus-visible:border-[#557568] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a]/20 dark:border-white/10 dark:bg-black/20">
          <option value="">All statuses</option>
          {BRIDGE_HISTORY_STATUSES.map((value) => <option key={value} value={value}>{formatStatus(value)}</option>)}
        </select>
        <button className="pc-button-primary min-h-11 rounded-xl px-4 text-sm font-semibold">Filter</button>
      </form>
      {invalidStatus ? <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-100" role="status">Unknown transfer status was ignored.</p> : null}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span aria-live="polite">{rows.length} transfer{rows.length === 1 ? "" : "s"} shown{page.pagination.hasNextPage ? " · more available" : ""}</span>
        {address || status ? <Link href="/history" className="font-semibold text-[#294a3b] hover:underline dark:text-[#adc0b6]">Clear filters</Link> : null}
      </div>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#090d0b]" aria-label="Bridge transaction history">
        {rows.length === 0 ? (
          <div className="p-8 text-center"><p className="text-sm font-medium text-slate-700 dark:text-slate-200">No transactions found</p><p className="mt-1 text-xs text-slate-500">Try another wallet address or clear the current status filter.</p></div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/10">
            {rows.map((row) => (
              <Link key={row.id} href={`/bridge/status/${encodeURIComponent(row.id)}`} className="grid gap-3 p-4 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#35584a] sm:grid-cols-[140px_minmax(0,1fr)_190px_150px] sm:items-center dark:hover:bg-white/[0.035]">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{row.direction.replaceAll("_", " → ")}</span>
                <span className="min-w-0"><span className="block truncate font-mono text-xs text-slate-500">{row.id}</span><span className="mt-1 block text-sm font-semibold tabular-nums">{baseUnitsToDecimalString(BigInt(row.principalBaseUnits), 9)} PWRC</span></span>
                <span><span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${statusTone(row.status)}`}>{formatStatus(row.status)}</span></span>
                <time className="text-xs text-slate-500" dateTime={row.createdAt}>{row.createdAt.replace("T", " ").slice(0, 19)} UTC</time>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function SummaryCard({ label, value, detail, tone = "default" }: { label: string; value: number; detail: string; tone?: "default" | "attention" }) {
  return <div className={`rounded-2xl border p-4 ${tone === "attention" ? "border-rose-200 bg-rose-50/70 dark:border-rose-500/20 dark:bg-rose-500/[0.08]" : "border-slate-200 bg-white/80 dark:border-white/10 dark:bg-white/[0.035]"}`}><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold tabular-nums text-slate-950 dark:text-white">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>;
}
