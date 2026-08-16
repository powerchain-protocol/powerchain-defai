import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-2xl py-12 sm:py-20">
      <section className="rounded-[20px] border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-950">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#294a3b] dark:text-[#adc0b6]">404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Page not found</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600 dark:text-slate-300">
          The requested PowerChain DeFAI page does not exist or has moved. No wallet action or transfer was submitted.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/bridge" className="inline-flex min-h-11 items-center rounded-xl bg-[#0b1511] px-4 text-sm font-semibold text-white transition hover:bg-[#102019] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] dark:bg-[#dfe7e3] dark:hover:bg-white">Open bridge</Link>
          <Link href="/history" className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900">View history</Link>
        </div>
      </section>
    </main>
  );
}
