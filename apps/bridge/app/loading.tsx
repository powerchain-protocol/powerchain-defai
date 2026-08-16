export default function AppLoading() {
  return (
    <main className="mx-auto w-full max-w-[1280px] animate-pulse space-y-5" aria-label="Loading PowerChain Bridge">
      <div className="space-y-2">
        <div className="h-3 w-28 rounded-full bg-slate-200 dark:bg-white/10" />
        <div className="h-9 w-72 max-w-[75vw] rounded-xl bg-slate-200 dark:bg-white/10" />
        <div className="h-4 w-[34rem] max-w-full rounded-full bg-slate-100 dark:bg-white/[0.06]" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,.62fr)]">
        <div className="h-[560px] rounded-[24px] border border-slate-200 bg-white dark:border-white/10 dark:bg-[#07100d]" />
        <div className="space-y-4">
          <div className="h-40 rounded-[18px] border border-slate-200 bg-white dark:border-white/10 dark:bg-[#090d0b]" />
          <div className="h-52 rounded-[18px] border border-slate-200 bg-white dark:border-white/10 dark:bg-[#090d0b]" />
        </div>
      </div>
      <span className="sr-only">Loading bridge workspace…</span>
    </main>
  );
}
