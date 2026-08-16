import type { ReactNode } from "react";
import Link from "next/link";

export function LegalPage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-4xl py-4 sm:py-8">
      <div className="mb-5 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
        <Link href="/chat" className="hover:text-[#294a3b] dark:hover:text-white">PowerChain DeFAI</Link><span aria-hidden="true">/</span><span>Legal</span>
      </div>
      <article className="pc-panel rounded-[26px] p-6 sm:p-9">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#294a3b] dark:text-[#d0dcd6]">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">{intro}</p>
        <div className="legal-copy mt-8 space-y-7 text-sm leading-7 text-slate-700 dark:text-slate-300">{children}</div>
      </article>
    </main>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return <section><h2 className="text-lg font-semibold text-slate-950 dark:text-white">{title}</h2><div className="mt-2 space-y-3">{children}</div></section>;
}
