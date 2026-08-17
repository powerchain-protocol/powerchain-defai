"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { isDashboardWorkspaceRoute } from "@/config/app-routes";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { WorkspaceShell } from "./workspace-shell";

export function ApplicationShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return isDashboardWorkspaceRoute(pathname)
    ? <DashboardShell>{children}</DashboardShell>
    : <WorkspaceShell>{children}</WorkspaceShell>;
}
