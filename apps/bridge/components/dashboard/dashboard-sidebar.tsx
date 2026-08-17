"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DoubleArrowLeftIcon, DoubleArrowRightIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/navigation/brand-logo";
import { APPLICATION_NAVIGATION_SECTIONS, isActiveRoute } from "@/components/navigation/navigation-config";
import { NavigationIcon } from "@/components/navigation/navigation-icon";

const STORAGE_KEY = "powerchain.dashboard.sidebar.collapsed";

export function DashboardSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try { setCollapsed(localStorage.getItem(STORAGE_KEY) === "1"); } catch {}
  }, []);

  function toggle() {
    setCollapsed((value) => {
      const next = !value;
      try { localStorage.setItem(STORAGE_KEY, next ? "1" : "0"); } catch {}
      return next;
    });
  }

  return (
    <aside
      className={`hidden h-dvh shrink-0 border-r border-white/10 bg-[#050807] text-white transition-[width] duration-200 lg:flex lg:flex-col ${collapsed ? "w-[82px]" : "w-[264px]"}`}
      aria-label="Dashboard navigation"
    >
      <div className={`flex min-h-20 shrink-0 items-center border-b border-white/10 ${collapsed ? "justify-center px-3" : "px-5"}`}>
        <BrandLogo inverse compact={collapsed} showText={!collapsed} />
      </div>

      {!collapsed ? (
        <div className="shrink-0 px-5 pb-2 pt-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d0dcd6]">Command center</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">One workspace for intelligence, execution, portfolio and runtime operations.</p>
        </div>
      ) : null}

      <nav className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3" aria-label="Dashboard sections">
        {APPLICATION_NAVIGATION_SECTIONS.map((section, index) => (
          <section key={section.id} className={index ? "mt-5" : undefined} aria-labelledby={`dashboard-nav-${section.id}`}>
            {!collapsed ? <p id={`dashboard-nav-${section.id}`} className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">{section.label}</p> : null}
            <div className="space-y-1">
              {section.items.map((item) => {
                const active = isActiveRoute(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? `${item.label} — ${item.description}` : item.description}
                    aria-current={active ? "page" : undefined}
                    className={`group flex min-h-11 items-center rounded-xl text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#557568] ${collapsed ? "justify-center px-2" : "gap-3 px-3"} ${active ? "bg-white/[0.08] text-white ring-1 ring-inset ring-white/10" : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-100"}`}
                  >
                    <span className={`grid size-8 shrink-0 place-items-center rounded-xl border transition ${active ? "border-[#8ea69a]/20 bg-[#29483c]/20 text-[#e0e8e4]" : "border-white/5 bg-white/[0.03] group-hover:text-white"}`}>
                      <NavigationIcon name={item.icon} className="size-4" />
                    </span>
                    {collapsed ? <span className="sr-only">{item.label}</span> : <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-3">
        {!collapsed ? (
          <div className="mb-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[#c8d6cf]">Security boundary</p>
            <p className="mt-1.5 text-[11px] leading-5 text-slate-400">Wallets sign. PowerChain prepares, validates, submits only user-authorized actions, and monitors finality.</p>
          </div>
        ) : null}
        <button
          type="button"
          onClick={toggle}
          className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
          aria-label={collapsed ? "Show dashboard sidebar labels" : "Hide dashboard sidebar labels"}
        >
          {collapsed ? <DoubleArrowRightIcon /> : <DoubleArrowLeftIcon />}
          {collapsed ? null : <span>Hide sidebar</span>}
        </button>
      </div>
    </aside>
  );
}
