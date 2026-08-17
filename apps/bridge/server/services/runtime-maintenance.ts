import "server-only";

import { getRuntimeMaintenanceState, setRuntimeMaintenanceState } from "@powerchain/database";

export async function getRuntimeMaintenance() {
  const persisted = await getRuntimeMaintenanceState();
  const override = ["1", "true", "yes", "on"].includes((process.env.POWERCHAIN_WORKER_DRAIN_MODE ?? "").trim().toLowerCase());
  return {
    ...persisted,
    draining: override || persisted.draining,
    environmentOverride: override,
    mutable: !override,
  };
}

export async function updateRuntimeMaintenance(input: { draining: boolean; expectedRevision: number; reason?: string | null; actor: string; requestId: string }) {
  const override = ["1", "true", "yes", "on"].includes((process.env.POWERCHAIN_WORKER_DRAIN_MODE ?? "").trim().toLowerCase());
  if (override && !input.draining) throw new Error("MAINTENANCE_ENV_OVERRIDE_ACTIVE");
  const persisted = await setRuntimeMaintenanceState(input);
  return { ...persisted, draining: override || persisted.draining, environmentOverride: override, mutable: !override, changed: persisted.revision !== input.expectedRevision };
}
