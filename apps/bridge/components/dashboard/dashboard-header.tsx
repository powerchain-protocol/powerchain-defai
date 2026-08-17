"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_ROUTES } from "@/config/app-routes";
import { APPLICATION_NAVIGATION_SECTIONS, APPLICATION_NAVIGATION, isActiveRoute } from "@/components/navigation/navigation-config";
import { BrandLogo } from "@/components/navigation/brand-logo";
import { MobileNavigationMenu } from "@/components/navigation/mobile-navigation-menu";
import { ProfileMenu } from "@/components/navigation/profile-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { HeaderWalletControls } from "@/components/wallet/header-wallet-controls";

function pageContext(pathname: string) {
  if (pathname.startsWith("/bridge/status/")) return { eyebrow: "Execution", title: "Bridge transfer status" };
  if (pathname.startsWith("/claims/status/")) return { eyebrow: "Portfolio", title: "Claim status" };

  const item = APPLICATION_NAVIGATION.find((candidate) => isActiveRoute(pathname, candidate.href));
  if (!item) return { eyebrow: "Workspace", title: "PowerChain Command Center" };
  const section = APPLICATION_NAVIGATION_SECTIONS.find((candidate) => candidate.items.some((entry) => entry.href === item.href));
  if (item.href === APP_ROUTES.dashboard) return { eyebrow: "Dashboard", title: "PowerChain Command Center" };
  return { eyebrow: section?.label ?? "Workspace", title: item.label };
}

export function DashboardHeader() {
  const pathname = usePathname();
  const context = pageContext(pathname);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 shadow-[0_1px_0_rgba(15,23,42,.015)] backdrop-blur-xl dark:border-white/10 dark:bg-[#070b09]/90 lg:static">
      <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6 lg:min-h-20 lg:px-8 xl:px-9">
        <div className="lg:hidden"><BrandLogo compact /></div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#294a3b] dark:text-[#d0dcd6]">{context.eyebrow}</p>
          <div className="mt-0.5 flex items-center gap-2">
            <h1 className="truncate text-sm font-semibold text-slate-950 dark:text-white sm:text-base">{context.title}</h1>
            <span className="hidden rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500 sm:inline dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400">Solana + Sui</span>
          </div>
        </div>
        <Link href={APP_ROUTES.status} className="hidden h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-[0_1px_2px_rgba(15,23,42,.03)] transition hover:border-[#9eafa7] hover:bg-slate-50 hover:text-[#264b3b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] md:flex dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.07]">
          <span className="size-2 rounded-full bg-[#3f6856] shadow-[0_0_0_3px_rgba(63,104,86,.10)] dark:bg-[#9bb7a9]" aria-hidden="true" />
          Runtime status
        </Link>
        <div className="ml-auto flex items-center gap-2"><ThemeToggle /><HeaderWalletControls /><ProfileMenu /><MobileNavigationMenu /></div>
      </div>
    </header>
  );
}
