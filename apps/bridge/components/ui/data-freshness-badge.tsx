export function DataFreshnessBadge({ stale, label = "Live data" }: { stale?: boolean; label?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${stale ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-200" : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"}`}>
      {stale ? "Delayed data" : label}
    </span>
  );
}
