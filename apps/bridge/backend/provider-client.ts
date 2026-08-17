import { BRIDGE_API_ENDPOINTS } from "./endpoints";
import { PROVIDER_RUNTIME_CONFIG } from "@/config/provider-runtime";
import { fetchJson } from "@/lib/data/http-client";
import { isProviderDiagnosticsPayload, isProviderHealthPayload, isProviderReadinessPayload } from "@/lib/data/runtime-validation";
import type { ProviderDiagnosticsPayload, ProviderHealthPayload, ProviderReadinessPayload } from "@/types/providers";

export type ProviderClientRequest = { readonly signal?: AbortSignal };

type ApiEnvelope = { readonly ok?: unknown; readonly data?: unknown };
function unwrapApiData(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const envelope = value as ApiEnvelope;
  return envelope.ok === true && "data" in envelope ? envelope.data : value;
}

async function requestValidated<T>(url: string, validate: (value: unknown) => value is T, options: ProviderClientRequest = {}): Promise<T> {
  const result = await fetchJson<unknown>(url, {
    timeoutMs: PROVIDER_RUNTIME_CONFIG.timeoutMs,
    maxAttempts: 1,
    ...(options.signal === undefined ? {} : { signal: options.signal }),
  });
  const payload = unwrapApiData(result);
  if (!validate(payload)) throw new Error("PROVIDER_RESPONSE_INVALID");
  return payload;
}

export const providerClient = Object.freeze({
  health(options: ProviderClientRequest = {}) {
    return requestValidated<ProviderHealthPayload>(BRIDGE_API_ENDPOINTS.providers.health, isProviderHealthPayload, options);
  },
  readiness(options: ProviderClientRequest = {}) {
    return requestValidated<ProviderReadinessPayload>(BRIDGE_API_ENDPOINTS.providers.readiness, isProviderReadinessPayload, options);
  },
  diagnostics(options: ProviderClientRequest = {}) {
    return requestValidated<ProviderDiagnosticsPayload>(BRIDGE_API_ENDPOINTS.providers.diagnostics, isProviderDiagnosticsPayload, options);
  },
});
