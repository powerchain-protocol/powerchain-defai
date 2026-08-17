import { DataError, retryAfterMs } from "./errors";
import { resolveClientApiRequest } from "@/lib/api/client-routing";

export type FetchJsonOptions = Omit<RequestInit, "signal"> & {
  signal?: AbortSignal;
  timeoutMs?: number;
  maxAttempts?: number;
  retryBaseMs?: number;
  retryStatuses?: readonly number[];
};

const DEFAULT_RETRY_STATUSES = [408, 425, 429, 500, 502, 503, 504] as const;

function abortSignal(parent: AbortSignal | undefined, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new DOMException("Request timed out", "TimeoutError")), timeoutMs);
  const onAbort = () => controller.abort(parent?.reason);
  parent?.addEventListener("abort", onAbort, { once: true });
  return {
    signal: controller.signal,
    cleanup() {
      clearTimeout(timer);
      parent?.removeEventListener("abort", onAbort);
    },
  };
}

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
    const timer = setTimeout(resolve, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason ?? new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function jittered(base: number, attempt: number) {
  const ceiling = Math.min(base * 2 ** Math.max(0, attempt - 1), 10_000);
  return Math.round(ceiling * (0.75 + Math.random() * 0.5));
}

export async function fetchJson<T>(url: string | URL, options: FetchJsonOptions = {}): Promise<T> {
  const {
    timeoutMs = 8_000,
    maxAttempts = 2,
    retryBaseMs = 250,
    retryStatuses = DEFAULT_RETRY_STATUSES,
    signal: parentSignal,
    headers,
    ...init
  } = options;
  const attempts = Math.max(1, Math.min(maxAttempts, 4));
  const timeout = Math.max(500, Math.min(timeoutMs, 30_000));
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const request = abortSignal(parentSignal, timeout);
    try {
      const requestHeaders = new Headers(headers);
      if (!requestHeaders.has("accept")) requestHeaders.set("accept", "application/json");
      const routed = resolveClientApiRequest(url, requestHeaders);
      const response = await fetch(routed.url, {
        ...init,
        headers: routed.headers,
        signal: request.signal,
        cache: init.cache ?? "no-store",
      });
      if (!response.ok) {
        const retryMs = retryAfterMs(response.headers);
        const error = new DataError(`HTTP ${response.status}`, {
          code: response.status === 429 ? "RATE_LIMITED" : "HTTP_ERROR",
          status: response.status,
          retryAfterMs: retryMs,
        });
        if (attempt < attempts && retryStatuses.includes(response.status)) {
          await sleep(retryMs ?? jittered(retryBaseMs, attempt), parentSignal);
          lastError = error;
          continue;
        }
        throw error;
      }
      const type = response.headers.get("content-type") ?? "";
      if (!type.toLowerCase().includes("application/json")) {
        throw new DataError("Expected JSON response", { code: "BAD_RESPONSE", status: response.status });
      }
      return (await response.json()) as T;
    } catch (error) {
      if (parentSignal?.aborted) throw new DataError("Request aborted", { code: "ABORTED", cause: error });
      if (request.signal.aborted) {
        const timeoutError = new DataError("Request timed out", { code: "TIMEOUT", cause: error });
        if (attempt < attempts) {
          lastError = timeoutError;
          await sleep(jittered(retryBaseMs, attempt), parentSignal);
          continue;
        }
        throw timeoutError;
      }
      if (error instanceof DataError) throw error;
      const networkError = new DataError("Network request failed", { code: "NETWORK_ERROR", cause: error });
      if (attempt < attempts) {
        lastError = networkError;
        await sleep(jittered(retryBaseMs, attempt), parentSignal);
        continue;
      }
      throw networkError;
    } finally {
      request.cleanup();
    }
  }
  throw lastError instanceof Error ? lastError : new DataError("Request unavailable", { code: "UNAVAILABLE" });
}
