import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "./status-badge";
import type { StatusSummary } from "@/types/status";
import { formatRelativeAge } from "@/utils/helpers";

export function StatusOverview({ summary, refreshing, onRefresh }: { summary: StatusSummary; refreshing: boolean; onRefresh: () => void }) {
  const refreshDisabled = refreshing || !summary.online;

  return (
    <Card as="section" className="overflow-hidden" aria-labelledby="status-overview-title">
      <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#35584a] dark:text-[#b9c8c1]">Execution readiness</p>
          <div className="mt-2 flex flex-wrap items-center gap-2.5">
            <h2 id="status-overview-title" className="text-2xl font-semibold tracking-[-.03em] text-slate-950 dark:text-white sm:text-[1.7rem]">{summary.label}</h2>
            <StatusBadge state={summary.state} />
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">{summary.description}</p>
        </div>
        <Button size="sm" className="w-full sm:w-auto" onClick={onRefresh} disabled={refreshDisabled} loading={refreshing} loadingLabel="Refreshing…" title={!summary.online ? "Reconnect to refresh runtime evidence" : undefined}>
          {!summary.online ? "Offline" : "Refresh status"}
        </Button>
      </div>

      <div className="grid border-t border-slate-200/80 bg-slate-50/45 sm:grid-cols-3 dark:border-white/8 dark:bg-white/[.018]">
        <Metric label="Services operational" value={`${summary.readyCount}/${summary.serviceCount}`} />
        <Metric label="Browser network" value={summary.online ? "Online" : "Offline"} />
        <Metric label="Evidence freshness" value={summary.stale ? "Stale" : summary.checkedAt ? formatRelativeAge(summary.checkedAt) : "Checking"} />
      </div>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-slate-200/70 px-4 py-3 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 dark:border-white/8 sm:px-5">
      <p className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-base font-semibold tracking-tight text-slate-950 dark:text-white sm:text-lg">{value}</p>
    </div>
  );
}
