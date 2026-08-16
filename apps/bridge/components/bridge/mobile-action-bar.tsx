"use client";

import type { ReactNode } from "react";

export function MobileActionBar({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white px-4 pt-3 shadow-[0_-12px_30px_rgba(15,23,42,.08)] md:hidden dark:border-slate-800 dark:bg-[#050807] dark:shadow-[0_-12px_30px_rgba(0,0,0,.28)]" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
      <div className="mx-auto max-w-lg">
        {hint ? <p className="mb-2 truncate text-center text-xs text-slate-500 dark:text-slate-400">{hint}</p> : null}
        <div className="[&>button]:min-h-12 [&>button]:w-full [&>a]:min-h-12 [&>a]:w-full">{children}</div>
      </div>
    </div>
  );
}
