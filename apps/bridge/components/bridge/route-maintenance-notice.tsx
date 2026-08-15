"use client";

export function RouteMaintenanceNotice({ startsAt, endsAt, message, blocking = false }: { startsAt?: string | Date | null; endsAt?: string | Date | null; message?: string | null; blocking?: boolean }) {
  const start = toTime(startsAt); const end = toTime(endsAt); const now = Date.now();
  const active = start !== null && start <= now && (end === null || end > now);
  const upcoming = start !== null && start > now;
  if (!active && !upcoming && !message) return null;
  const title = active ? "Scheduled maintenance in progress" : upcoming ? "Scheduled maintenance" : "Route maintenance notice";
  return <aside className={`rounded-2xl border p-3.5 ${blocking || active ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/25 dark:text-amber-200" : "border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"}`} role={blocking ? "alert" : "status"} aria-live="polite"><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs leading-5">{message || (active ? "New transfers may be temporarily unavailable while existing transfers continue to be tracked." : "Bridge availability may be limited during the maintenance window.")}</p>{start !== null || end !== null ? <p className="mt-2 text-[11px] font-medium opacity-80">{start !== null ? `Starts ${formatUtc(start)}` : ""}{start !== null && end !== null ? " · " : ""}{end !== null ? `Ends ${formatUtc(end)}` : ""}</p> : null}</aside>;
}
function toTime(value?: string | Date | null) { if (!value) return null; const date = value instanceof Date ? value : new Date(value); const time = date.getTime(); return Number.isFinite(time) ? time : null; }
function formatUtc(ms: number) { const d=new Date(ms); const p=(n:number)=>String(n).padStart(2,"0"); return `${d.getUTCFullYear()}-${p(d.getUTCMonth()+1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} UTC`; }
