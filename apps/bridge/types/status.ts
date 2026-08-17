export type StatusState = "operational" | "degraded" | "outage" | "checking";
export type StatusServiceId = "system" | "database" | "solana" | "sui" | "workers" | "queues" | "routing";

export type StatusService = Readonly<{
  id: StatusServiceId;
  label: string;
  description: string;
  state: StatusState;
  detail: string;
  latencyMs?: number;
  updatedAt?: string;
}>;

export type StatusSummary = Readonly<{
  state: StatusState;
  label: string;
  description: string;
  checkedAt?: string;
  online: boolean;
  stale: boolean;
  readyCount: number;
  serviceCount: number;
}>;

export type StatusViewModel = Readonly<{
  summary: StatusSummary;
  services: readonly StatusService[];
  refreshing: boolean;
  loading: boolean;
  errors: readonly string[];
}>;
