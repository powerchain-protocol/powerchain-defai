import type { Metadata } from "next";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "PowerChain DeFAI command center for wallet connectivity, operations, runtime status and workspace shortcuts.",
};

export default function DashboardPage() {
  return <DashboardOverview />;
}
