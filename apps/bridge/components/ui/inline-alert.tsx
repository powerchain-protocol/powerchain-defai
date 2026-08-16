import type { ReactNode } from "react";

type Tone = "info" | "success" | "warning" | "danger";

const toneClasses: Record<Tone, string> = {
  info: "border-[#d4ddd8] bg-[#f1f4f2] text-[#07100d] dark:border-[#29483c]/60 dark:bg-[#09110e]/55 dark:text-[#edf2ef]",
  success: "border-[#d4ddd8] bg-[#f1f4f2] text-[#07100d] dark:border-[#29483c]/60 dark:bg-[#09110e]/55 dark:text-[#edf2ef]",
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
