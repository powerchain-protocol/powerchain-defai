import type { ReactNode } from "react";
import { MobileBottomNavigation } from "@/components/navigation/mobile-bottom-navigation";
import { Shell } from "@/components/navigation/shell";
import { DashboardFooter } from "./dashboard-footer";
import { DashboardHeader } from "./dashboard-header";
import { DashboardSidebar } from "./dashboard-sidebar";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Shell
        sidebar={<DashboardSidebar />}
        header={<DashboardHeader />}
        footer={<div className="hidden lg:block"><DashboardFooter /></div>}
        backgroundClass="pc-dashboard-shell"
      >
        <main id="main-content" tabIndex={-1} className="w-full flex-1 px-4 pb-24 pt-5 outline-none sm:px-6 sm:pt-6 lg:px-8 lg:pb-8 lg:pt-7 xl:px-9">
          {children}
        </main>
      </Shell>
      <MobileBottomNavigation />
    </>
  );
}
