"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APPLICATION_NAVIGATION, isActiveRoute } from "./navigation-config";

export function PrimaryNavigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  if (mobile) {
    return <nav className="no-scrollbar mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2 text-xs sm:px-6 lg:hidden" aria-label="Mobile primary">{APPLICATION_NAVIGATION.map((item)=>{const active=isActiveRoute(pathname,item.href); return <Link key={item.href} href={item.href} aria-current={active?"page":undefined} className={`shrink-0 rounded-lg px-3 py-2 font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] ${active?"bg-slate-950 text-white dark:bg-white dark:text-slate-950":"text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"}`}>{item.label}</Link>})}</nav>;
  }
  return <nav className="hidden flex-1 items-center gap-1 text-sm lg:flex" aria-label="Primary">{APPLICATION_NAVIGATION.map((item)=>{const active=isActiveRoute(pathname,item.href); return <Link key={item.href} href={item.href} aria-current={active?"page":undefined} className={`rounded-lg px-3 py-2 font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] ${active?"bg-slate-100 text-slate-950 dark:bg-slate-900 dark:text-white":"text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"}`}>{item.label}</Link>})}</nav>;
}
