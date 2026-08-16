"use client";

import Link from "next/link";
import { useCookies } from "@/hooks/use-cookies";

export function CookieNotice() {
  const { showBanner, choose } = useCookies();
  if (!showBanner) return null;

  return (
    <aside className="fixed inset-x-3 bottom-[5.75rem] z-[85] mx-auto max-w-3xl sm:bottom-5 lg:bottom-6" aria-label="Cookie preferences">
      <div className="pc-review-sheet rounded-[22px] p-4 sm:flex sm:items-center sm:gap-5 sm:p-5">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-950 dark:text-white">Cookie choices</p>
          <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
            PowerChain DeFAI uses essential storage for theme, transaction preferences and your cookie choice. Optional storage stays off unless you accept it. Your choice is remembered for 180 days.
          </p>
          <Link href="/legal/cookies" className="mt-2 inline-flex text-xs font-semibold text-[#294a3b] underline-offset-4 hover:underline dark:text-[#d0dcd6]">Cookie policy</Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-0 sm:flex sm:shrink-0">
          <button type="button" onClick={() => choose("essential")} className="pc-button-light min-h-11 rounded-xl px-4 text-xs font-semibold">Essential only</button>
          <button type="button" onClick={() => choose("all")} className="pc-button-primary min-h-11 rounded-xl px-4 text-xs font-semibold">Accept optional</button>
        </div>
      </div>
    </aside>
  );
}
