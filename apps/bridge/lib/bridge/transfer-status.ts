export const TRANSFER_PROGRESS_ORDER = [
  "CREATED",
  "SOURCE_SUBMITTED",
  "SOURCE_FINALIZED",
  "MESSAGE_OBSERVED",
  "DESTINATION_SUBMITTED",
  "DESTINATION_FINALIZED",
  "COMPLETED",
] as const;

export type KnownTransferStatus =
  | (typeof TRANSFER_PROGRESS_ORDER)[number]
  | "FAILED"
  | "RECONCILIATION_REQUIRED";

export const TERMINAL_TRANSFER_STATUSES = new Set<string>([
  "COMPLETED",
  "FAILED",
  "RECONCILIATION_REQUIRED",
]);

export function normalizeTransferStatus(value: unknown): string {
  if (typeof value !== "string") return "CREATED";
  const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
  return normalized || "CREATED";
}

export function transferStatusLabel(value: unknown): string {
  return normalizeTransferStatus(value).replaceAll("_", " ");
}

export function isTerminalTransferStatus(value: unknown): boolean {
  return TERMINAL_TRANSFER_STATUSES.has(normalizeTransferStatus(value));
}

export function transferNeedsAttention(value: unknown): boolean {
  const status = normalizeTransferStatus(value);
  return status === "FAILED" || status === "RECONCILIATION_REQUIRED";
}

export function progressIndexForStatus(value: unknown): number {
  return TRANSFER_PROGRESS_ORDER.indexOf(normalizeTransferStatus(value) as (typeof TRANSFER_PROGRESS_ORDER)[number]);
}
