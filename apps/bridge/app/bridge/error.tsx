"use client";

import { RecoveryActions } from "@/components/navigation/recovery-actions";

export default function BridgeError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto max-w-2xl py-10">
      <section className="rounded-[20px] border border-rose-200 bg-white p-6 shadow-sm dark:border-rose-900/70 dark:bg-slate-950" role="alert">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-600 dark:text-rose-400">Bridge unavailable</p>
        <h1 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">The bridge interface could not load</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">No transfer was submitted by this page error. Retry the interface, and check an existing transfer from History before signing anything again.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={reset} className="min-h-11 rounded-xl bg-[#0b1511] px-4 text-sm font-semibold text-white transition hover:bg-[#102019] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] dark:bg-[#dfe7e3] dark:hover:bg-white">Try again</button>
          <RecoveryActions />
        </div>
      </section>
    </main>
  );
}
