import type { StatusServiceId } from "@/types/status";

export const STATUS_REFRESH_MS = 30_000;
export const STATUS_STALE_AFTER_MS = 90_000;
export const STATUS_SERVICE_LABELS: Record<StatusServiceId, string> = Object.freeze({
  system: "Execution envelope",
  database: "Database",
  solana: "Solana providers",
  sui: "Sui providers",
  workers: "Settlement workers",
  queues: "Operation queues",
  routing: "Route protection",
});
