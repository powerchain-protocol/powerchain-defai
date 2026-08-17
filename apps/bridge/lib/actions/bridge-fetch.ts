"use client";

import { apiFetch } from "@/lib/api/browser-api";

export class BridgeActionError extends Error {
  constructor(readonly code: string, message: string, readonly status: number, readonly requestId?: string) {
    super(message);
    this.name = "BridgeActionError";
  }
}

function requestId() {
  const webCrypto = globalThis.crypto as Crypto | undefined;
  if (!webCrypto) throw new BridgeActionError("CRYPTO_UNAVAILABLE", "Secure browser randomness is required for bridge actions.", 0);
  if (typeof webCrypto.randomUUID === "function") return webCrypto.randomUUID();
  const bytes = new Uint8Array(16);
  webCrypto.getRandomValues(bytes);
  return `pc-${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export function createIdempotencyKey(prefix = "bridge") {
  const id = requestId();
  return `${prefix}:${id}`.slice(0, 128);
}

export async function postBridgeAction<T>(url: string, body: unknown, options: {
  idempotencyKey?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
} = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutMs = Math.min(30_000, Math.max(2_000, options.timeoutMs ?? 10_000));
  const timer = window.setTimeout(() => controller.abort("timeout"), timeoutMs);
  const abort = () => controller.abort(options.signal?.reason ?? "aborted");
  options.signal?.addEventListener("abort", abort, { once: true });
  const rid = requestId();
  try {
    const response = await apiFetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-request-id": rid,
        ...(options.idempotencyKey ? { "idempotency-key": options.idempotencyKey } : {}),
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => null) as { error?: string; message?: string; requestId?: string } | null;
    if (!response.ok) throw new BridgeActionError(payload?.error ?? "BRIDGE_ACTION_FAILED", payload?.message ?? `Bridge request failed (${response.status})`, response.status, payload?.requestId ?? response.headers.get("x-request-id") ?? rid);
    return payload as T;
  } catch (error) {
    if (error instanceof BridgeActionError) throw error;
    if (controller.signal.aborted) throw new BridgeActionError("BRIDGE_ACTION_TIMEOUT_OR_ABORT", "Bridge request was cancelled or timed out. Check transfer status before retrying a submission.", 0, rid);
    throw new BridgeActionError("BRIDGE_ACTION_NETWORK_ERROR", error instanceof Error ? error.message : "Bridge request failed", 0, rid);
  } finally {
    window.clearTimeout(timer);
    options.signal?.removeEventListener("abort", abort);
  }
}
