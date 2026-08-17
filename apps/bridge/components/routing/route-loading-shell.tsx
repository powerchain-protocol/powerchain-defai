export function RouteLoadingShell({ label = "Loading workspace" }: { label?: string }) {
  return (
    <main className="mx-auto w-full max-w-[1280px] animate-pulse space-y-5" aria-busy="true" aria-label={label}>
      <div className="space-y-2">
        <div className="h-3 w-28 rounded-full bg-slate-200 dark:bg-white/10" />
        <div className="h-9 w-72 max-w-[75vw] rounded-xl bg-slate-200 dark:bg-white/10" />
        <div className="h-4 w-[34rem] max-w-full rounded-full bg-slate-100 dark:bg-white/[0.06]" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,.62fr)]">
        <div className="h-[480px] rounded-[var(--pc-radius-panel)] border border-slate-200 bg-white dark:border-white/10 dark:bg-[#07100d]" />
        <div className="space-y-4">
          <div className="h-40 rounded-[var(--pc-radius-card)] border border-slate-200 bg-white dark:border-white/10 dark:bg-[#090d0b]" />
          <div className="h-52 rounded-[var(--pc-radius-card)] border border-slate-200 bg-white dark:border-white/10 dark:bg-[#090d0b]" />
        </div>
      </div>
      <span className="sr-only">{label}…</span>
    </main>
  );
}
