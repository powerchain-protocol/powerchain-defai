"use client";
import type { ReactNode } from "react";
export type TransactionMessageTone = "info" | "warning" | "error" | "success";
const toneClass: Record<TransactionMessageTone,string> = {
  info: "border-slate-200 bg-white/65 text-slate-700 dark:border-white/10 dark:bg-white/[.035] dark:text-slate-200",
  warning: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/45 dark:bg-amber-950/25 dark:text-amber-100",
  error: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/45 dark:bg-rose-950/25 dark:text-rose-100",
  success: "border-[#c7d4cd] bg-[#f1f4f2] text-[#214233] dark:border-white/10 dark:bg-white/[.045] dark:text-[#edf2ef]",
};
export function TransactionMessage({tone="info",children,action}:{tone?:TransactionMessageTone;children:ReactNode;action?:ReactNode}){
  return <div className={`rounded-2xl border px-3 py-2.5 text-xs font-medium ${toneClass[tone]}`} role={tone==="error"?"alert":"status"} aria-live="polite"><div>{children}</div>{action?<div className="mt-2">{action}</div>:null}</div>;
}
