export function formatUtcTimestamp(value?: string | number | Date | null): string {
  if (value == null || value === "") return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  const iso = date.toISOString();
  return `${iso.slice(0, 10)} ${iso.slice(11, 19)} UTC`;
}

export function shortIdentifier(value: string, left = 6, right = 6): string {
  if (value.length <= left + right + 3) return value;
  return `${value.slice(0, left)}…${value.slice(-right)}`;
}

export function normalizeActivityStatus(value?: string | null): string {
  const raw = (value || "UNKNOWN").trim().toUpperCase();
  const aliases: Record<string, string> = {
    SUCCESS: "FINALIZED",
    SUCCEEDED: "FINALIZED",
    COMPLETE: "COMPLETED",
    ERROR: "FAILED",
    PENDING_CONFIRMATION: "PENDING",
  };
  return aliases[raw] || raw.replaceAll("_", " ");
}
