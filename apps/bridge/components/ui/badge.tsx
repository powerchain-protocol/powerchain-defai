import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

const tones: Record<BadgeTone, string> = {
  neutral: "border-slate-200 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/[.05] dark:text-slate-300",
  success: "border-[#c6d4cd] bg-[#eef4f1] text-[#244b3b] dark:border-[#35584a]/55 dark:bg-[#173b2d]/28 dark:text-[#d9e3de]",
  warning: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/55 dark:bg-amber-950/25 dark:text-amber-200",
  danger: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/55 dark:bg-rose-950/25 dark:text-rose-200",
  info: "border-[#cbd8d1] bg-[#f2f6f4] text-[#294a3b] dark:border-[#35584a]/55 dark:bg-[#173b2d]/24 dark:text-[#d5e1db]",
};

export function Badge({ tone = "neutral", className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.1em]",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
