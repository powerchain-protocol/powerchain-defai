"use client";

import type { ReactNode } from "react";
import { AppFooter } from "./app-footer";
import { AppSidebar } from "./app-sidebar";
import { BrandLogo } from "./brand-logo";
import { MobileBottomNavigation } from "./mobile-bottom-navigation";
import { MobileNavigationMenu } from "./mobile-navigation-menu";
import { ProfileMenu } from "./profile-menu";
import { Shell } from "./shell";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { HeaderWalletControls } from "@/components/wallet/header-wallet-controls";

function WorkspaceHeader() {
  return <header className="pc-glass sticky top-0 z-40 shrink-0 border-x-0 border-t-0 lg:static"><div className="mx-auto flex min-h-16 w-full max-w-[1500px] items-center gap-3 px-4 sm:px-6 lg:min-h-20 lg:px-8"><div className="flex items-center gap-2 lg:hidden"><BrandLogo compact /><span className="hidden text-sm font-semibold tracking-tight text-slate-950 sm:block dark:text-white">PowerChain DeFAI</span></div><div className="hidden min-w-0 flex-1 lg:block"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#294a3b] dark:text-[#d0dcd6]">PowerChain</p><p className="mt-0.5 text-sm font-medium text-slate-500">AI-assisted DeFi workspace · wallet controlled</p></div><div className="ml-auto flex items-center gap-2"><ThemeToggle /><HeaderWalletControls /><ProfileMenu /><MobileNavigationMenu /></div></div></header>;
}

export function WorkspaceShell({ children }: { children: ReactNode }) {
  return <><Shell sidebar={<AppSidebar />} header={<WorkspaceHeader />} footer={<div className="hidden lg:block"><AppFooter /></div>}><main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-[1500px] flex-1 px-4 pb-28 pt-5 outline-none sm:px-6 lg:px-8 lg:pb-8 lg:pt-7">{children}</main></Shell><MobileBottomNavigation /></>;
}
