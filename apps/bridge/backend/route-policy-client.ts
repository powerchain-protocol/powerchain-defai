import { BRIDGE_API_ENDPOINTS } from "./endpoints";
import { PROVIDER_RUNTIME_CONFIG } from "@/config/provider-runtime";
import { fetchJson } from "@/lib/data/http-client";
import { isRoutePolicyDiagnosticsPayload } from "@/lib/data/route-policy-validation";
import type { RoutePolicyDiagnosticsPayload } from "@/types/route-policy";

type ApiEnvelope = { readonly ok?: unknown; readonly data?: unknown };

function unwrapApiData(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const envelope = value as ApiEnvelope;
  return envelope.ok === true && "data" in envelope ? envelope.data : value;
}

export async function fetchRoutePolicyDiagnostics(signal?: AbortSignal): Promise<RoutePolicyDiagnosticsPayload> {
  const result = await fetchJson<unknown>(BRIDGE_API_ENDPOINTS.system.routePolicy, {
    timeoutMs: PROVIDER_RUNTIME_CONFIG.timeoutMs,
    maxAttempts: 1,
    ...(signal === undefined ? {} : { signal }),
  });
  const payload = unwrapApiData(result);
  if (!isRoutePolicyDiagnosticsPayload(payload)) throw new Error("ROUTE_POLICY_RESPONSE_INVALID");
  return payload;
}
