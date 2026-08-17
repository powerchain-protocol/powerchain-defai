"use client";

import Link from "next/link";
import { APP_ROUTES } from "@/config/app-routes";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-950 dark:bg-[#050807] dark:text-white">
        <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-4 py-10">
          <section className="w-full rounded-[24px] border border-rose-200 bg-white p-6 shadow-sm dark:border-rose-900/60 dark:bg-[#090d0b] sm:p-8" role="alert" aria-labelledby="global-error-title">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-600 dark:text-rose-300">PowerChain runtime error</p>
            <h1 id="global-error-title" className="mt-2 text-2xl font-semibold tracking-tight">The application shell could not recover</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">No wallet transaction, bridge completion, staking reward, or settlement is inferred from this error. Verify any submitted operation before trying it again.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" onClick={reset} className="min-h-11 rounded-xl bg-[#0b1511] px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] dark:bg-[#dfe7e3] dark:text-[#07100d]">Try again</button>
              <Link href={APP_ROUTES.history} className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-semibold dark:border-slate-700">View history</Link>
              <Link href={APP_ROUTES.status} className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-semibold dark:border-slate-700">Runtime status</Link>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
