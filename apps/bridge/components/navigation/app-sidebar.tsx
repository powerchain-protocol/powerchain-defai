"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DoubleArrowLeftIcon, DoubleArrowRightIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { BrandLogo } from "./brand-logo";
import { APPLICATION_NAVIGATION_SECTIONS, isActiveRoute } from "./navigation-config";
import { NavigationIcon } from "./navigation-icon";

const STORAGE_KEY = "powerchain.sidebar.collapsed";

export function AppSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => { try { setCollapsed(localStorage.getItem(STORAGE_KEY) === "1"); } catch {} }, []);
  function toggle() { setCollapsed((value) => { const next = !value; try { localStorage.setItem(STORAGE_KEY, next ? "1" : "0"); } catch {} return next; }); }
  return (
    <aside className={`pc-cinematic-panel hidden h-dvh shrink-0 border-y-0 border-l-0 text-white transition-[width] duration-200 lg:flex lg:flex-col ${collapsed ? "w-[84px]" : "w-[256px]"}`} aria-label="PowerChain application navigation">
      <div className={`flex min-h-20 shrink-0 items-center border-b border-white/10 ${collapsed ? "justify-center px-3" : "px-5"}`}><BrandLogo inverse compact={collapsed} showText={!collapsed} /></div>
      <nav className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-3 py-4" aria-label="Primary">
        {APPLICATION_NAVIGATION_SECTIONS.map((section, sectionIndex) => (
          <section key={section.id} className={sectionIndex ? "mt-5" : undefined} aria-labelledby={`nav-section-${section.id}`}>
            {collapsed ? null : <div className="px-3 pb-2"><p id={`nav-section-${section.id}`} className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{section.label}</p></div>}
            <div className="space-y-1">
              {section.items.map((item) => { const selected = isActiveRoute(pathname, item.href); return (
                <Link key={item.href} href={item.href} aria-current={selected ? "page" : undefined} title={collapsed ? `${item.label} — ${item.description}` : item.description} className={`group flex min-h-11 items-center rounded-xl text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#557568] ${collapsed ? "justify-center px-2" : "gap-3 px-3"} ${selected ? "bg-[#29483c]/20 text-[#e0e8e4] ring-1 ring-inset ring-[#8ea69a]/20" : "text-slate-300 hover:bg-white/[0.07] hover:text-white"}`}>
                  <span className={`grid size-8 shrink-0 place-items-center rounded-xl border transition ${selected ? "border-[#c4d0ca]/15 bg-[#c7d4ce]/10 text-[#e0e8e4]" : "border-white/5 bg-white/[0.04] text-slate-400 group-hover:text-slate-200"}`}><NavigationIcon name={item.icon} className="size-4" /></span>
                  {collapsed ? <span className="sr-only">{item.label}</span> : <span className="truncate">{item.label}</span>}
                </Link>
              ); })}
            </div>
          </section>
        ))}
      </nav>
      <div className="shrink-0 border-t border-white/10 p-3">
        {!collapsed ? <div className="mb-3 rounded-2xl border border-[#c4d0ca]/15 bg-[#365f4f]/[0.06] p-3.5 text-white"><p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[#d0dcd6]">Settlement rail</p><p className="mt-1.5 text-sm font-semibold">Wormhole NTT</p><p className="mt-1 text-[11px] leading-5 text-slate-400">Sui wPWRC ↔ Solana PWRC · wallet-signed · finality-verified.</p></div> : null}
        <button type="button" onClick={toggle} className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white" aria-label={collapsed ? "Show sidebar labels" : "Hide sidebar labels"}>{collapsed ? <DoubleArrowRightIcon /> : <DoubleArrowLeftIcon />}{collapsed ? null : <span>Hide sidebar</span>}</button>
      </div>
    </aside>
  );
}
