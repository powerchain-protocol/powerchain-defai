import type { Metadata } from "next";
import { OperationalStatusDashboard } from "@/components/status/operational-status-dashboard";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Status",
  description: "PowerChain provider health, execution readiness, route-policy pressure, redundancy and process-local diagnostics.",
};

export default function StatusPage() {
  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Runtime status"
        description="Fail-closed provider readiness and bounded request-policy diagnostics for wallet actions, with non-authoritative operational telemetry."
      />
      <OperationalStatusDashboard />
    </div>
  );
}
