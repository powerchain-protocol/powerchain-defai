"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "./brand-logo";
import { NavigationIcon, type NavigationIconName } from "./navigation-icon";

const items: ReadonlyArray<readonly [string, string, NavigationIconName]> = [
  ["AI Assistant", "/chat", "chat"],
  ["Swap", "/swap", "swap"],
  ["Bridge", "/bridge", "bridge"],
  ["History", "/history", "history"],
  ["Explorer", "/explorer", "explorer"],
  ["Wallet", "/wallet", "wallet"],
  ["Claim", "/claim", "claim"],
  ["Staking", "/staking", "staking"],
  ["Assets", "/assets", "assets"],
  ["Fees", "/fees", "fees"],
  ["Integrations", "/integrations", "integrations"],
];

function active(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar() {
  const pathname = usePathname();
  return (
    <aside className="pc-cinematic-panel hidden w-[232px] shrink-0 border-y-0 border-l-0 text-white lg:flex lg:min-h-screen lg:flex-col" aria-label="PowerChain application navigation">
      <div className="flex min-h-20 items-center border-b border-white/10 px-5">
        <BrandLogo inverse showText />
      </div>
      <nav className="space-y-1 px-3 py-5" aria-label="Primary">
        {items.map(([label, href, icon]) => {
          const selected = active(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={selected ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#557568] ${selected ? "bg-[#29483c]/20 text-[#e0e8e4] ring-1 ring-inset ring-[#8ea69a]/20" : "text-slate-300 hover:bg-white/[0.07] hover:text-white"}`}
            >
              <span className={`grid size-8 place-items-center rounded-xl border ${selected ? "border-[#c4d0ca]/15 bg-[#c7d4ce]/10 text-[#e0e8e4]" : "border-white/5 bg-white/[0.04] text-slate-400"}`}><NavigationIcon name={icon} className="size-4" /></span>
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto p-4">
        <div className="pc-glass rounded-2xl p-4 text-white dark:text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#d0dcd6]">Settlement</p>
          <p className="mt-2 text-sm font-semibold">Wormhole NTT</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">Sui wPWRC ↔ Solana PWRC. Wallet-signed, finality-verified, 1:1 principal.</p>
        </div>
        <p className="mt-4 px-1 text-[11px] leading-5 text-slate-500">PowerChain DeFAI · v1.0.0</p>
      </div>
    </aside>
  );
}
