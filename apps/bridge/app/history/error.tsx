"use client";

export default function HistoryError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto max-w-2xl py-10">
      <section className="rounded-[20px] border border-amber-200 bg-white p-6 shadow-sm dark:border-amber-900/70 dark:bg-slate-950" role="alert">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-400">History unavailable</p>
        <h1 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">Transfer history could not be loaded</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">This does not change the state of any persisted transfer. Retry the database-backed history view when the service is available.</p>
        <button type="button" onClick={reset} className="mt-5 min-h-11 rounded-xl bg-[#0b1511] px-4 text-sm font-semibold text-white transition hover:bg-[#102019] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] dark:bg-[#dfe7e3] dark:hover:bg-white">Try again</button>
      </section>
    </main>
  );
}
