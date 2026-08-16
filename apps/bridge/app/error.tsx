"use client";

import Link from "next/link";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[55vh] w-full max-w-2xl items-center justify-center py-10">
      <section className="w-full rounded-[24px] border border-rose-200 bg-white p-6 shadow-sm dark:border-rose-900/60 dark:bg-[#090d0b] sm:p-8" role="alert" aria-labelledby="app-error-title">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-600 dark:text-rose-300">Application error</p>
        <h1 id="app-error-title" className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">The workspace could not finish loading</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">No bridge completion is inferred from this screen. Check an existing operation in History before signing or submitting anything again.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={reset} className="min-h-11 rounded-xl bg-[#0b1511] px-4 text-sm font-semibold text-white transition hover:bg-[#102019] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] dark:bg-[#dfe7e3] dark:hover:bg-white">Try again</button>
          <Link href="/history" className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:border-[#9eafa7] hover:text-[#264b3b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] dark:border-slate-700 dark:text-slate-200 dark:hover:border-[#46685a] dark:hover:text-[#d9e3de]">View history</Link>
        </div>
      </section>
    </main>
  );
}
