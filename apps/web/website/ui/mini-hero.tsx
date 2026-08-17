import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "@radix-ui/react-icons";

export function MiniHero({
  eyebrow,
  title,
  description,
  backHref,
  backLabel,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
}) {
  return (
    <section className="web-mini-hero">
      <div className="web-container relative z-10 py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-4xl text-center">
          {backHref ? (
            <div className="mb-8 flex justify-center">
              <Link href={backHref} className="web-mini-back">
                <ArrowLeftIcon /> {backLabel ?? "Back"}
              </Link>
            </div>
          ) : null}
          <p className="web-eyebrow">{eyebrow}</p>
          <h1 className="web-display mt-4 text-balance text-4xl font-semibold tracking-[-.045em] text-brand-950 dark:text-brand-100 sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          <p className="web-section-copy mx-auto mt-5 max-w-2xl text-balance sm:text-lg">{description}</p>
          {actions ? <div className="mt-8 flex flex-wrap justify-center gap-3">{actions}</div> : null}
        </div>
      </div>
    </section>
  );
}
