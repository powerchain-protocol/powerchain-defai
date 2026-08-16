import type { TransferEvent } from "@/hooks/use-transfer-status";

function utc(value?: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  const iso = date.toISOString();
  return `${iso.slice(0, 10)} ${iso.slice(11, 19)} UTC`;
}

export function TransferActivityList({ events, limit = 8 }: { events: readonly TransferEvent[]; limit?: number }) {
  const visible = events.slice(-Math.max(1, Math.min(limit, 50))).reverse();
  return (
    <section aria-labelledby="transfer-activity-title">
      <div className="flex items-center justify-between gap-3">
        <h3 id="transfer-activity-title" className="text-sm font-semibold text-slate-950 dark:text-white">Activity</h3>
        <span className="text-xs text-slate-500 dark:text-slate-400">{events.length} event{events.length === 1 ? "" : "s"}</span>
      </div>
      {visible.length === 0 ? (
        <p className="mt-3 rounded-xl bg-slate-50 px-3 py-3 text-xs text-slate-500 dark:bg-slate-900 dark:text-slate-400">Waiting for the first persisted transfer event.</p>
      ) : (
        <ol className="mt-3 space-y-2" aria-label="Transfer activity events">
          {visible.map((event) => {
            const status = String(event.status ?? "UPDATE").replaceAll("_", " ");
            const timestamp = utc(event.createdAt);
            return (
              <li key={event.id} className="flex gap-3 rounded-xl border border-slate-100 px-3 py-2.5 dark:border-slate-800">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#1c4334]" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{status}</p>
                  <p className="mt-0.5 truncate font-mono text-[10px] text-slate-400" title={event.id}>{event.id}</p>
                </div>
                {timestamp ? <time dateTime={event.createdAt} className="shrink-0 text-[10px] tabular-nums text-slate-400">{timestamp}</time> : null}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
