"use client";

export default function WalletError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto max-w-2xl py-10">
      <section className="rounded-[20px] border border-amber-200 bg-white p-6 shadow-sm dark:border-amber-900/70 dark:bg-slate-950" role="alert">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-400">Wallet overview unavailable</p>
        <h1 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">Wallet data could not be loaded</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Your wallet remains under your control. Retry the read-only overview without reconnecting or signing another transaction.</p>
        <button type="button" onClick={reset} className="mt-5 min-h-11 rounded-xl bg-[#0b1511] px-4 text-sm font-semibold text-white transition hover:bg-[#102019] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] dark:bg-[#dfe7e3] dark:hover:bg-white">Try again</button>
      </section>
    </main>
  );
}
