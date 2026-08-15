"use client";

export default function BridgeError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto max-w-2xl py-10">
      <section className="rounded-[20px] border border-rose-200 bg-white p-6 shadow-sm dark:border-rose-900/70 dark:bg-slate-950" role="alert">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-600 dark:text-rose-400">Bridge unavailable</p>
        <h1 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">The bridge interface could not load</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">No transfer was submitted by this page error. Retry the interface, and check an existing transfer from History before signing anything again.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={reset} className="min-h-11 rounded-xl bg-[#0B1730] px-4 text-sm font-semibold text-white transition hover:bg-[#122447] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-blue-600 dark:hover:bg-blue-500">Try again</button>
          <a href="/history" className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900">View history</a>
        </div>
      </section>
    </main>
  );
}
