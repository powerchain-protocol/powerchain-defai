import { BRIDGE_API_ENDPOINTS } from "./endpoints";
import { PROVIDER_RUNTIME_CONFIG } from "@/config/provider-runtime";
import { fetchJson } from "@/lib/data/http-client";
import { isSystemReadinessPayload } from "@/lib/data/system-readiness-validation";
import type { SystemReadinessPayload } from "@/types/system-readiness";

type ApiEnvelope = { readonly ok?: unknown; readonly data?: unknown };
function unwrapApiData(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const envelope = value as ApiEnvelope;
  return envelope.ok === true && "data" in envelope ? envelope.data : value;
}

export async function fetchSystemReadiness(signal?: AbortSignal): Promise<SystemReadinessPayload> {
  const result = await fetchJson<unknown>(BRIDGE_API_ENDPOINTS.system.readiness, {
    timeoutMs: PROVIDER_RUNTIME_CONFIG.timeoutMs,
    maxAttempts: 1,
    ...(signal === undefined ? {} : { signal }),
  });
  const payload = unwrapApiData(result);
  if (!isSystemReadinessPayload(payload)) throw new Error("SYSTEM_READINESS_RESPONSE_INVALID");
  return payload;
}
