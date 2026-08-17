"use client";

import { useMemo } from "react";
import { useProviderDiagnostics } from "@/hooks/use-provider-diagnostics";
import { useProviderHealth } from "@/hooks/use-provider-health";
import { useProviderReadiness } from "@/hooks/use-provider-readiness";
import { useRoutePolicyDiagnostics } from "@/hooks/use-route-policy-diagnostics";
import { useSystemReadiness } from "@/hooks/use-system-readiness";
import { STATUS_REFRESH_MS, STATUS_STALE_AFTER_MS } from "@/constants/status";
import type { StatusViewModel } from "@/types/status";
import { summarizeStatus } from "@/utils/health";
import { buildStatusServices } from "@/services/status";
import { ageMs } from "@/lib/data/runtime-validation";
import { dedupeStrings } from "@/utils/helpers";

export function useStatus(refreshMs = STATUS_REFRESH_MS): StatusViewModel & {
  refresh: () => Promise<void>;
  diagnostics: ReturnType<typeof useProviderDiagnostics>;
  system: ReturnType<typeof useSystemReadiness>;
  routePolicy: ReturnType<typeof useRoutePolicyDiagnostics>;
} {
  const health = useProviderHealth(refreshMs);
  const readiness = useProviderReadiness(Math.max(refreshMs, 30_000));
  const diagnostics = useProviderDiagnostics(Math.max(refreshMs, 30_000));
  const routePolicy = useRoutePolicyDiagnostics(Math.max(refreshMs, 30_000));
  const system = useSystemReadiness(refreshMs);

  const services = useMemo(
    () => buildStatusServices({ system: system.data, readiness: readiness.data, checking: readiness.loading }),
    [readiness.data, readiness.loading, system.data],
  );

  const errors = dedupeStrings([health.error, readiness.error, diagnostics.error, routePolicy.error, system.error]);
  const loading = health.loading || readiness.loading || system.loading;
  const refreshing = health.refreshing || readiness.refreshing || diagnostics.refreshing || routePolicy.refreshing || system.refreshing;
  const checkedAt = system.data?.checkedAt ?? readiness.data?.checkedAt ?? health.data?.checkedAt;
  const staleByAge = Boolean(checkedAt && ageMs(checkedAt) > Math.max(STATUS_STALE_AFTER_MS, refreshMs * 2));
  const stale = health.stale || readiness.stale || staleByAge;
  const online = health.online && readiness.online;
  const summary = summarizeStatus(services, { online, stale, ...(checkedAt ? { checkedAt } : {}), checking: loading });

  const refresh = async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    await Promise.allSettled([health.refresh(), readiness.refresh(), diagnostics.refresh(), routePolicy.refresh(), system.refresh()]);
  };

  return { summary, services, refreshing, loading, errors, refresh, diagnostics, system, routePolicy };
}
