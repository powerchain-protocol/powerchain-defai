"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BrandLogo } from "./brand-logo";
import { NavigationIcon, type NavigationIconName } from "./navigation-icon";

const items: ReadonlyArray<readonly [string, string, NavigationIconName, string]> = [
  ["AI Assistant", "/chat", "chat", "DeFi guidance without signing authority"],
  ["Swap", "/swap", "swap", "Trade across Solana and Sui"],
  ["Bridge", "/bridge", "bridge", "Transfer wPWRC and PWRC"],
  ["Explorer", "/explorer", "explorer", "Read-only Solana and Sui explorer"],
  ["History", "/history", "history", "Review bridge operations"],
  ["Wallet", "/wallet", "wallet", "Balances and activity"],
  ["Claim", "/claim", "claim", "Claim eligible PWRC"],
  ["Staking", "/staking", "staking", "Governed PWRC/wPWRC staking"],
  ["Assets", "/assets", "assets", "Verify PWRC representations"],
  ["Fees", "/fees", "fees", "Review service and network fees"],
  ["Integrations", "/integrations", "integrations", "Runtime providers and protocols"],
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function MenuIcon({ close = false }: { close?: boolean }) {
  return close ? (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
  ) : (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
  );
}

export function MobileNavigationMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key !== "Tab") return;
      const panel = closeRef.current?.closest<HTMLElement>("[data-mobile-nav-panel]");
      if (!panel) return;
      const focusable = [...panel.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) return;
      const first = focusable.at(0);
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKeyDown);
    requestAnimationFrame(() => closeRef.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      requestAnimationFrame(() => triggerRef.current?.focus());
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="grid size-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-[#9eafa7] hover:text-[#264b3b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] lg:hidden dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:border-[#35584a]/40 dark:hover:bg-[#29483c]/20 dark:hover:text-[#d9e3de]"
        aria-label="Open navigation menu"
        aria-expanded={open}
        aria-controls="mobile-navigation-panel"
      >
        <MenuIcon />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80] lg:hidden" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setOpen(false); }}>
          <div className="absolute inset-0 bg-black/70" aria-hidden="true" />
          <section
            id="mobile-navigation-panel"
            data-mobile-nav-panel
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-navigation-title"
            className="absolute inset-y-0 right-0 flex w-[min(88vw,380px)] flex-col border-l border-white/10 bg-[#050807] text-white shadow-2xl"
          >
            <div className="flex min-h-20 items-center gap-3 border-b border-white/10 px-5">
              <BrandLogo inverse showText />
              <h2 id="mobile-navigation-title" className="sr-only">PowerChain navigation</h2>
              <button ref={closeRef} type="button" onClick={() => setOpen(false)} className="ml-auto grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#557568]" aria-label="Close navigation menu"><MenuIcon close /></button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Mobile application navigation">
              {items.map(([label, href, icon, description]) => {
                const selected = isActive(pathname, href);
                return (
                  <Link key={href} href={href} aria-current={selected ? "page" : undefined} className={`flex min-h-14 items-center gap-3 rounded-xl px-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#557568] ${selected ? "bg-[#29483c]/20 text-[#e0e8e4] ring-1 ring-inset ring-[#8ea69a]/20" : "text-slate-200 hover:bg-white/[0.06]"}`}>
                    <span className={`grid size-9 shrink-0 place-items-center rounded-xl border ${selected ? "border-[#c4d0ca]/15 bg-[#c7d4ce]/10 text-[#e0e8e4]" : "border-white/5 bg-white/[0.04] text-slate-400"}`}><NavigationIcon name={icon} className="size-[18px]" /></span>
                    <span className="min-w-0"><span className="block text-sm font-semibold">{label}</span><span className="mt-0.5 block truncate text-[11px] text-slate-500">{description}</span></span>
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-white/10 p-4">
              <div className="rounded-2xl border border-[#c4d0ca]/15 bg-[#365f4f]/[0.06] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#d0dcd6]">Default route</p>
                <p className="mt-1 text-sm font-semibold">Sui wPWRC → Solana PWRC</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">Wormhole NTT · 1:1 principal · wallet-signed</p>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
