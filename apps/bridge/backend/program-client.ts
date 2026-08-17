import { BRIDGE_API_ENDPOINTS } from "./endpoints";
import { fetchJson } from "@/lib/data/http-client";
import { isProgramReadinessPayload, isProgramRuntimeItem } from "@/lib/data/program-runtime-validation";
import type { ProgramReadinessPayload, ProgramRuntimeItem } from "@/types/programs";

type Envelope = { readonly ok?: unknown; readonly data?: unknown };
function unwrap(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const envelope = value as Envelope;
  return envelope.ok === true && "data" in envelope ? envelope.data : value;
}

export async function fetchProgramReadiness(signal?: AbortSignal, force = false): Promise<ProgramReadinessPayload> {
  const endpoint = force ? `${BRIDGE_API_ENDPOINTS.programs.readiness}?force=1` : BRIDGE_API_ENDPOINTS.programs.readiness;
  const response = await fetchJson<unknown>(endpoint, { timeoutMs: 8_000, maxAttempts: 1, ...(signal ? { signal } : {}) });
  const payload = unwrap(response);
  if (!isProgramReadinessPayload(payload)) throw new Error("PROGRAM_READINESS_RESPONSE_INVALID");
  return payload;
}

export async function fetchProgramReadinessItem(programId: ProgramRuntimeItem["id"], signal?: AbortSignal, force = false): Promise<ProgramRuntimeItem> {
  const base = BRIDGE_API_ENDPOINTS.programs.readinessItem(programId);
  const response = await fetchJson<unknown>(force ? `${base}?force=1` : base, { timeoutMs: 8_000, maxAttempts: 1, ...(signal ? { signal } : {}) });
  const payload = unwrap(response);
  if (!isProgramRuntimeItem(payload)) throw new Error("PROGRAM_READINESS_ITEM_RESPONSE_INVALID");
  return payload;
}
