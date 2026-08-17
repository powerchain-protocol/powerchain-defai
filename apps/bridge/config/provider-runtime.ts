import {
  PROVIDER_HEALTH_REFRESH_MAX_MS,
  PROVIDER_HEALTH_REFRESH_MIN_MS,
  PROVIDER_READINESS_REFRESH_MAX_MS,
  PROVIDER_READINESS_REFRESH_MIN_MS,
  PROVIDER_REQUEST_TIMEOUT_MS,
} from "@/constants/provider-runtime";

export const PROVIDER_RUNTIME_CONFIG = Object.freeze({
  timeoutMs: PROVIDER_REQUEST_TIMEOUT_MS,
  health: Object.freeze({ defaultRefreshMs: 30_000, minRefreshMs: PROVIDER_HEALTH_REFRESH_MIN_MS, maxRefreshMs: PROVIDER_HEALTH_REFRESH_MAX_MS }),
  readiness: Object.freeze({ defaultRefreshMs: 60_000, minRefreshMs: PROVIDER_READINESS_REFRESH_MIN_MS, maxRefreshMs: PROVIDER_READINESS_REFRESH_MAX_MS }),
  failClosed: true,
} as const);
