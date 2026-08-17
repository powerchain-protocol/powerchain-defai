"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MOBILE_BOTTOM_NAVIGATION, isActiveRoute } from "./navigation-config";
import { NavigationIcon } from "./navigation-icon";

export function MobileBottomNavigation() {
  const pathname = usePathname();
  return <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white px-2 pb-[max(.45rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-12px_30px_rgba(15,23,42,.06)] lg:hidden dark:border-slate-800 dark:bg-[#050807]" aria-label="Mobile primary navigation"><div className="mx-auto grid max-w-lg grid-cols-5">{MOBILE_BOTTOM_NAVIGATION.map((item)=>{const selected=isActiveRoute(pathname,item.href); return <Link key={item.href} href={item.href} aria-current={selected?"page":undefined} className={`relative flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] ${selected?"text-[#294a3b] dark:text-[#d0dcd6]":"text-slate-500 dark:text-slate-400"}`}><span className={`grid size-8 place-items-center rounded-xl transition ${selected?"bg-[#f1f4f2] text-[#294a3b] dark:bg-[#29483c]/18 dark:text-[#d0dcd6]":"text-slate-400"}`}><NavigationIcon name={item.icon} className="size-[18px]" /></span>{item.label === "AI Assistant" ? "AI" : item.label}{selected?<span aria-hidden="true" className="absolute -bottom-1 h-0.5 w-6 rounded-full bg-[#1c4334]"/>:null}</Link>})}</div></nav>;
}
