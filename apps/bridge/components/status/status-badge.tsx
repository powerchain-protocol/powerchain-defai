import type { StatusState } from "@/types/status";

const styles: Record<StatusState, string> = {
  operational: "bg-[#eaf0ed] text-[#214233] ring-[#cbd9d2] dark:bg-[#173b2d]/35 dark:text-[#d0dcd6] dark:ring-[#29483c]",
  degraded: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/25 dark:text-amber-200 dark:ring-amber-900/70",
  outage: "bg-rose-50 text-rose-800 ring-rose-200 dark:bg-rose-950/25 dark:text-rose-200 dark:ring-rose-900/70",
  checking: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-white/[.06] dark:text-slate-300 dark:ring-white/10",
};

export function StatusBadge({ state }: { state: StatusState }) {
  return <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.13em] ring-1 ring-inset ${styles[state]}`}><span className="pc-status-dot size-1.5 rounded-full bg-current" aria-hidden="true"/>{state}</span>;
}
