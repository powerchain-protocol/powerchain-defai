"use client";

export default function HistoryError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto max-w-2xl py-10">
      <section className="rounded-[20px] border border-amber-200 bg-white p-6 shadow-sm dark:border-amber-900/70 dark:bg-slate-950" role="alert">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-400">History unavailable</p>
        <h1 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">Transfer history could not be loaded</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">This does not change the state of any persisted transfer. Retry the database-backed history view when the service is available.</p>
        <button type="button" onClick={reset} className="mt-5 min-h-11 rounded-xl bg-[#0B1730] px-4 text-sm font-semibold text-white transition hover:bg-[#122447] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-blue-600 dark:hover:bg-blue-500">Try again</button>
      </section>
    </main>
  );
}
