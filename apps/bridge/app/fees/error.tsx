"use client";

export default function FeesError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="mx-auto flex min-h-[55vh] max-w-xl items-center px-4 py-12"><div className="w-full rounded-[20px] border border-red-200 bg-white p-6 dark:border-red-900/60 dark:bg-slate-950"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-600">Unable to load</p><h1 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">Fee transparency is temporarily unavailable</h1><p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Your bridge state has not changed. Retry the page or return to the bridge.</p><button type="button" onClick={reset} className="mt-5 min-h-11 rounded-xl bg-[#0b1511] px-5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] dark:bg-[#dfe7e3]">Try again</button></div></main>;
}
