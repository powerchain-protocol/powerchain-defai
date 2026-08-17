import type { ProviderReadinessItem } from "@/types/providers";
import type { SystemReadinessPayload } from "@/types/system-readiness";
import type { StatusService, StatusState, StatusSummary } from "@/types/status";

export function statusStateFromSystem(state: SystemReadinessPayload["state"]): StatusState {
  return state === "ready" ? "operational" : state === "degraded" ? "degraded" : "outage";
}

export function statusStateFromProvider(provider: ProviderReadinessItem | undefined): StatusState {
  if (!provider || !provider.ready) return "outage";
  return provider.redundancy === "full" ? "operational" : "degraded";
}

export function statusStateFromPressure(pressure: "normal" | "elevated" | "high"): StatusState {
  return pressure === "normal" ? "operational" : pressure === "elevated" ? "degraded" : "outage";
}

export function summarizeStatus(services: readonly StatusService[], input: { online: boolean; stale: boolean; checkedAt?: string; checking?: boolean }): StatusSummary {
  const readyCount = services.filter((item) => item.state === "operational").length;
  const hasOutage = services.some((item) => item.state === "outage");
  const hasDegraded = services.some((item) => item.state === "degraded");
  const state: StatusState = input.checking ? "checking" : !input.online || hasOutage ? "outage" : input.stale || hasDegraded ? "degraded" : "operational";
  const labels: Record<StatusState, [string, string]> = {
    operational: ["All monitored systems operational", "Provider redundancy and execution gates are currently healthy."],
    degraded: ["PowerChain is operating with constraints", "At least one runtime dependency is degraded or status evidence is stale."],
    outage: ["New operations are restricted", "A required runtime dependency is unavailable. Existing persisted status remains readable."],
    checking: ["Checking PowerChain runtime", "Refreshing provider, worker and route-policy evidence."],
  };
  return { state, label: labels[state][0], description: labels[state][1], ...(input.checkedAt ? { checkedAt: input.checkedAt } : {}), online: input.online, stale: input.stale, readyCount, serviceCount: services.length };
}
