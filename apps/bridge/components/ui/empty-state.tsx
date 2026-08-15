import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center rounded-[20px] border border-dashed border-slate-300 bg-slate-50/60 px-5 py-10 text-center dark:border-slate-700 dark:bg-slate-900/40">
      {icon ? <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">{icon}</div> : null}
      <h2 className="text-sm font-semibold text-slate-950 dark:text-white">{title}</h2>
      <p className="mt-1 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
