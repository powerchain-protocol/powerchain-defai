export type DataErrorCode =
  | "ABORTED"
  | "BAD_RESPONSE"
  | "HTTP_ERROR"
  | "NETWORK_ERROR"
  | "RATE_LIMITED"
  | "TIMEOUT"
  | "UNAVAILABLE";

export class DataError extends Error {
  readonly code: DataErrorCode;
  readonly status?: number;
  readonly retryAfterMs?: number;
  readonly cause?: unknown;

  constructor(message: string, options: { code: DataErrorCode; status?: number; retryAfterMs?: number; cause?: unknown }) {
    super(message);
    this.name = "DataError";
    this.code = options.code;
    this.status = options.status;
    this.retryAfterMs = options.retryAfterMs;
    this.cause = options.cause;
  }
}

export function retryAfterMs(headers: Headers): number | undefined {
  const value = headers.get("retry-after");
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(seconds * 1000, 60_000);
  const at = Date.parse(value);
  if (!Number.isFinite(at)) return undefined;
  return Math.max(0, Math.min(at - Date.now(), 60_000));
}
