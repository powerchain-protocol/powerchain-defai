export function compactAddress(value: string, start = 6, end = 4): string {
  const normalized = value.trim();
  return normalized.length > start + end + 2 ? `${normalized.slice(0, start)}…${normalized.slice(-end)}` : normalized;
}

export function formatRelativeAge(iso: string | number | Date | undefined, now = Date.now()): string {
  if (iso === undefined) return "Unknown";
  const value = iso instanceof Date ? iso.getTime() : typeof iso === "number" ? iso : Date.parse(iso);
  if (!Number.isFinite(value)) return "Unknown";
  const seconds = Math.max(0, Math.round((now - value) / 1000));
  if (seconds < 5) return "Just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function formatDateTime(value: string | number | Date | null | undefined): string {
  if (value == null) return "Unknown";
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function humanizeCode(value: string): string {
  return value.replaceAll("_", " ").toLowerCase().replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

export function dedupeStrings(values: readonly (string | null | undefined)[]): string[] {
  return [...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))];
}

export function formatPercent(value: number, digits = 0): string {
  if (!Number.isFinite(value)) return "—";
  const normalized = clampNumber(value, 0, 1) * 100;
  return `${normalized.toFixed(Math.max(0, Math.min(2, digits)))}%`;
}

const PUBLIC_ERROR_CODE = /^[A-Z][A-Z0-9_]{2,95}$/;

/**
 * Preserve explicit machine-style error codes while preventing arbitrary
 * provider/browser text from being reflected into user-facing surfaces.
 */
export function safeClientErrorCode(error: unknown, fallback: string): string {
  const raw = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const normalized = raw.trim();
  return PUBLIC_ERROR_CODE.test(normalized) ? normalized : fallback;
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === "AbortError"
    : error instanceof Error && error.name === "AbortError";
}
