"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useProviderHealth } from "@/hooks/use-provider-health";
import { useProviderReadiness } from "@/hooks/use-provider-readiness";

type ProviderRuntimeContextValue = {
  readonly health: ReturnType<typeof useProviderHealth>;
  readonly readiness: ReturnType<typeof useProviderReadiness>;
  readonly executable: boolean;
};

const ProviderRuntimeContext = createContext<ProviderRuntimeContextValue | null>(null);

export function ProviderRuntimeProvider({ children }: { children: ReactNode }) {
  const health = useProviderHealth();
  const readiness = useProviderReadiness();
  const executable = health.online && !health.stale && !health.unavailable && readiness.ready;
  return <ProviderRuntimeContext.Provider value={{ health, readiness, executable }}>{children}</ProviderRuntimeContext.Provider>;
}

export function useProviderRuntime(): ProviderRuntimeContextValue {
  const value = useContext(ProviderRuntimeContext);
  if (!value) throw new Error("useProviderRuntime must be used within ProviderRuntimeProvider");
  return value;
}
