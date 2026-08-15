import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 max-w-3xl">
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">{eyebrow}</p> : null}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl dark:text-white">{title}</h1>
        {description ? <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base dark:text-slate-300">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
