import Link from "next/link";
import { prisma } from "@powerchain/database/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { baseUnitsToDecimalString } from "@/lib/bridge/base-units";

export const dynamic = "force-dynamic";

const HISTORY_STATUSES = [
  "CREATED",
  "SOURCE_SUBMITTING",
  "SOURCE_SUBMITTED",
  "SOURCE_FINALIZED",
  "MESSAGE_OBSERVED",
  "DESTINATION_SUBMITTED",
  "DESTINATION_FINALIZED",
  "RECONCILIATION_REQUIRED",
  "COMPLETED",
  "FAILED",
] as const;

type HistoryStatus = (typeof HISTORY_STATUSES)[number];

function safe(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function parseHistoryStatus(value: string): HistoryStatus | null {
  const normalized = value.trim().toUpperCase();
  return HISTORY_STATUSES.find((status) => status === normalized) ?? null;
}

function formatStatus(value: string): string {
  return value.replaceAll("_", " ");
}

function statusTone(value: string): string {
  if (value === "COMPLETED") return "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900";
  if (value === "FAILED" || value === "RECONCILIATION_REQUIRED") return "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900";
  if (value.includes("FINALIZED") || value === "MESSAGE_OBSERVED") return "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900";
  return "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800";
}

export default async function HistoryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const search = await searchParams;
  const address = safe(search.address).trim();
  const requestedStatus = safe(search.status);
  const status = parseHistoryStatus(requestedStatus);
  const invalidStatus = Boolean(requestedStatus.trim()) && status === null;

  const rows = await prisma.bridgeTransfer.findMany({
    where: {
      ...(address ? { OR: [{ sourceAddress: address }, { destinationAddress: address }] } : {}),
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <main className="mx-auto max-w-6xl space-y-5">
      <PageHeader eyebrow="PowerChain History" title="Bridge transfers" description="Persisted bridge operations. Explorer/indexer data is supporting context; finality and reconciliation remain authoritative." />
      <form className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_220px_auto] dark:border-slate-800 dark:bg-slate-950" role="search">
        <label className="sr-only" htmlFor="history-address">Wallet address</label>
        <input id="history-address" name="address" defaultValue={address} placeholder="Wallet address" autoComplete="off" spellCheck={false} className="min-h-11 rounded-xl border border-slate-300 bg-transparent px-3 text-sm focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 dark:border-slate-700" />
        <label className="sr-only" htmlFor="history-status">Transfer status</label>
        <select id="history-status" name="status" defaultValue={status ?? ""} className="min-h-11 rounded-xl border border-slate-300 bg-transparent px-3 text-sm focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 dark:border-slate-700">
          <option value="">All statuses</option>
          {HISTORY_STATUSES.map((value) => <option key={value} value={value}>{formatStatus(value)}</option>)}
        </select>
        <button className="min-h-11 rounded-xl bg-[#0B1730] px-4 text-sm font-semibold text-white transition hover:bg-[#122447] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:bg-blue-600 dark:hover:bg-blue-500">Filter</button>
      </form>
      {invalidStatus ? <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-100" role="status">Unknown transfer status was ignored.</p> : null}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950" aria-label="Bridge transfer history">
        {rows.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">No transfers found</p>
            <p className="mt-1 text-xs text-slate-500">Try another wallet address or clear the current status filter.</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-100 sm:hidden dark:divide-slate-800">
              {rows.map((row) => {
                const amount = `${baseUnitsToDecimalString(BigInt(row.principalBaseUnits.toFixed(0)), 9)} PWRC`;
                return (
                  <Link key={row.id} href={`/bridge/status/${encodeURIComponent(row.id)}`} className="block p-4 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 dark:hover:bg-slate-900/50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{row.direction.replaceAll("_", " → ")}</p>
                        <p className="mt-1 text-base font-semibold tabular-nums text-slate-950 dark:text-white">{amount}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${statusTone(row.status)}`}>{formatStatus(row.status)}</span>
                    </div>
                    <p className="mt-3 truncate font-mono text-[11px] text-slate-500">{row.id}</p>
                    <time className="mt-1 block text-[11px] text-slate-500" dateTime={row.createdAt.toISOString()}>{row.createdAt.toISOString().replace("T", " ").slice(0, 19)} UTC</time>
                  </Link>
                );
              })}
            </div>
            <div className="hidden divide-y divide-slate-100 sm:block dark:divide-slate-800">
              {rows.map((row) => (
                <Link key={row.id} href={`/bridge/status/${encodeURIComponent(row.id)}`} className="grid gap-2 p-4 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 sm:grid-cols-[140px_minmax(0,1fr)_190px_150px] sm:items-center dark:hover:bg-slate-900/50">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{row.direction.replaceAll("_", " → ")}</span>
                  <span className="min-w-0">
                    <span className="block truncate font-mono text-xs text-slate-500">{row.id}</span>
                    <span className="mt-1 block text-sm font-semibold tabular-nums">{baseUnitsToDecimalString(BigInt(row.principalBaseUnits.toFixed(0)), 9)} PWRC</span>
                  </span>
                  <span><span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${statusTone(row.status)}`}>{formatStatus(row.status)}</span></span>
                  <time className="text-xs text-slate-500" dateTime={row.createdAt.toISOString()}>{row.createdAt.toISOString().replace("T", " ").slice(0, 19)} UTC</time>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
