import type { ReactNode } from "react";
import { MiniHero } from "./mini-hero";

export function LegalPage({
  eyebrow,
  title,
  description,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <>
      <MiniHero eyebrow={eyebrow} title={title} description={description} backHref="/" backLabel="Home" />
      <section className="web-section py-14 sm:py-18">
        <div className="web-container">
          <article className="web-legal-card mx-auto max-w-4xl">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Last updated {updated}</p>
            <div className="web-legal-copy mt-8">{children}</div>
          </article>
        </div>
      </section>
    </>
  );
}
