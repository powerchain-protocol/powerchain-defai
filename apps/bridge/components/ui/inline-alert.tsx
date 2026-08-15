import type { ReactNode } from "react";

type Tone = "info" | "success" | "warning" | "danger";

const toneClasses: Record<Tone, string> = {
  info: "border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-900/70 dark:bg-blue-950/35 dark:text-blue-100",
  success: "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/70 dark:bg-emerald-950/35 dark:text-emerald-100",
  warning: "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/35 dark:text-amber-100",
  danger: "border-red-200 bg-red-50 text-red-950 dark:border-red-900/70 dark:bg-red-950/35 dark:text-red-100",
};

export function InlineAlert({ title, children, tone = "info" }: { title: string; children?: ReactNode; tone?: Tone }) {
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={`rounded-2xl border px-4 py-3 ${toneClasses[tone]}`}>
      <p className="text-sm font-semibold">{title}</p>
      {children ? <div className="mt-1 text-sm opacity-85">{children}</div> : null}
    </div>
  );
}
