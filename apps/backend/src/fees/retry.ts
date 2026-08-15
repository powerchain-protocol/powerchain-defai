export const SERVICE_FEE_RETRY_BASE_MS = 5_000;
export const SERVICE_FEE_RETRY_MAX_MS = 5 * 60_000;

export function serviceFeeRetryDelayMs(attemptCount: number): number {
  const normalized = Math.max(1, Math.min(20, Math.trunc(attemptCount)));
  return Math.min(SERVICE_FEE_RETRY_MAX_MS, SERVICE_FEE_RETRY_BASE_MS * 2 ** (normalized - 1));
}

export function nextServiceFeeRetryAt(attemptCount: number, now = new Date()): Date {
  return new Date(now.getTime() + serviceFeeRetryDelayMs(attemptCount));
}
