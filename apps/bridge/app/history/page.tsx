import Link from "next/link";
import { prisma } from "@powerchain/database/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { baseUnitsToDecimalString } from "@/lib/bridge/base-units";
export const dynamic = "force-dynamic";
const safe = (v: string | string[] | undefined) => Array.isArray(v) ? v[0] ?? "" : v ?? "";
export default async function HistoryPage({ searchParams }: { searchParams: Promise<Record<string,string|string[]|undefined>> }) {
  const sp = await searchParams; const address = safe(sp.address).trim(); const status = safe(sp.status).trim().toUpperCase();
  const rows = await prisma.bridgeTransfer.findMany({ where: { ...(address ? { OR: [{sourceAddress:address},{destinationAddress:address}] } : {}), ...(status ? {status: status as never}: {}) }, orderBy:{createdAt:"desc"}, take:50 });
  return <main className="space-y-5"><PageHeader eyebrow="PowerChain History" title="Bridge transfers" description="Persisted bridge operations. Explorer/indexer data is supporting context; finality and reconciliation remain authoritative." />
    <form className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_220px_auto] dark:border-slate-800 dark:bg-slate-950">
      <input name="address" defaultValue={address} placeholder="Wallet address" className="min-h-11 rounded-xl border border-slate-300 bg-transparent px-3 text-sm dark:border-slate-700" />
      <select name="status" defaultValue={status} className="min-h-11 rounded-xl border border-slate-300 bg-transparent px-3 text-sm dark:border-slate-700"><option value="">All statuses</option><option value="CREATED">Created</option><option value="SOURCE_SUBMITTED">Source submitted</option><option value="SOURCE_FINALIZED">Source finalized</option><option value="DESTINATION_SUBMITTED">Destination submitted</option><option value="DESTINATION_FINALIZED">Destination finalized</option><option value="COMPLETED">Completed</option><option value="RECONCILIATION_REQUIRED">Needs reconciliation</option><option value="FAILED">Failed</option></select>
      <button className="min-h-11 rounded-xl bg-[#0B1730] px-4 text-sm font-semibold text-white">Filter</button>
    </form>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      {rows.length === 0 ? <div className="p-8 text-center text-sm text-slate-500">No persisted transfers match the current filter.</div> : <div className="divide-y divide-slate-100 dark:divide-slate-800">{rows.map(r=><Link key={r.id} href={`/bridge/status/${r.id}`} className="grid gap-2 p-4 hover:bg-slate-50 sm:grid-cols-[140px_1fr_160px_140px] sm:items-center dark:hover:bg-slate-900/50"><span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{r.direction.replaceAll("_"," → ")}</span><span className="min-w-0"><span className="block truncate font-mono text-xs text-slate-500">{r.id}</span><span className="mt-1 block text-sm font-semibold tabular-nums">{baseUnitsToDecimalString(BigInt(r.principalBaseUnits.toFixed(0)),9)} PWRC</span></span><span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{r.status.replaceAll("_"," ")}</span><time className="text-xs text-slate-500" dateTime={r.createdAt.toISOString()}>{r.createdAt.toISOString().replace("T"," ").slice(0,19)} UTC</time></Link>)}</div>}
    </section>
  </main>;
}
