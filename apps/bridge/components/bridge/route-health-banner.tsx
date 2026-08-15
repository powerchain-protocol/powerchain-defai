export type RouteHealth = "NORMAL" | "DEGRADED" | "PAUSED" | "INCIDENT";

const COPY: Record<RouteHealth, { title: string; body: string; tone: string }> = {
  NORMAL: { title: "Route available", body: "The route is accepting new bridge transfers.", tone: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/25 dark:text-emerald-200" },
  DEGRADED: { title: "Route degraded", body: "Transfers remain available, but confirmation may take longer than usual.", tone: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/25 dark:text-amber-200" },
  PAUSED: { title: "Route paused", body: "New transfers are temporarily disabled. Existing transfers continue to be tracked.", tone: "border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" },
  INCIDENT: { title: "Route incident", body: "Do not submit a new transfer until the route returns to a safe operating state.", tone: "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/25 dark:text-red-200" },
};

export function RouteHealthBanner({ health, message, onRefresh, statusHref = "/status" }: { health: RouteHealth; message?: string | null; onRefresh?: () => void; statusHref?: string }) {
  const copy = COPY[health];
  return <aside className={`rounded-2xl border p-3.5 ${copy.tone}`} aria-live="polite" role={health === "INCIDENT" ? "alert" : "status"}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{copy.title}</p><p className="mt-1 text-xs leading-5 opacity-90">{message || copy.body}</p></div>{onRefresh ? <button type="button" onClick={onRefresh} className="min-h-9 shrink-0 rounded-lg px-2.5 text-xs font-bold underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">Refresh</button> : null}</div>{health !== "NORMAL" ? <a href={statusHref} className="mt-2 inline-flex min-h-9 items-center text-xs font-bold underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">View network status</a> : null}</aside>;
}
