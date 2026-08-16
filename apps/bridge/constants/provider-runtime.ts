export const PROVIDER_HEALTH_REFRESH_MIN_MS = 10_000;
export const PROVIDER_HEALTH_REFRESH_MAX_MS = 120_000;
export const PROVIDER_READINESS_REFRESH_MIN_MS = 30_000;
export const PROVIDER_READINESS_REFRESH_MAX_MS = 180_000;
export const PROVIDER_REQUEST_TIMEOUT_MS = 6_000;

export function clampRefreshMs(value: number, minimum: number, maximum: number) {
  if (!Number.isFinite(value)) return minimum;
  return Math.max(minimum, Math.min(Math.floor(value), maximum));
}
