import type { ApiHeadersFactory } from "./api-client";

export type BridgeApiClientOptions = { baseUrl: string; fetch: typeof globalThis.fetch; headers?: ApiHeadersFactory };
export type BridgeQuoteRequest = { direction: "SOLANA_TO_SUI" | "SUI_TO_SOLANA"; principalBaseUnits: string; sourceAddress: string; destinationAddress: string };
export type BridgeTransferCreateRequest = { quoteId: string; intentCommitment: string; runtimeSnapshotId: string; sourceTx?: string };

export class BridgeApiClient {
  readonly #baseUrl: string;
  readonly #fetch: typeof globalThis.fetch;
  readonly #headers: ApiHeadersFactory | undefined;

  constructor(options: BridgeApiClientOptions) {
    this.#baseUrl = options.baseUrl.replace(/\/$/, "");
    this.#fetch = options.fetch;
    this.#headers = options.headers;
  }

  async #baseHeaders(): Promise<HeadersInit | undefined> {
    return typeof this.#headers === "function" ? await this.#headers() : this.#headers;
  }

  async #json<T>(path: string, init?: RequestInit): Promise<T> {
    const headers = new Headers(await this.#baseHeaders());
    new Headers(init?.headers).forEach((value, key) => headers.set(key, value));
    if (!headers.has("accept")) headers.set("accept", "application/json");
    const response = await this.#fetch(`${this.#baseUrl}${path}`, { ...init, headers });
    if (!response.ok) throw new Error(`POWERCHAIN_BRIDGE_HTTP_${response.status}`);
    return await response.json() as T;
  }

  config<T = Record<string, unknown>>(init?: RequestInit) { return this.#json<T>("/api/v1/bridge/config", init); }
  routes<T = Record<string, unknown>>(init?: RequestInit) { return this.#json<T>("/api/v1/bridge/routes", init); }
  runtime<T = Record<string, unknown>>(init?: RequestInit) { return this.#json<T>("/api/v1/bridge/runtime", init); }
  history<T = Record<string, unknown>>(query = "", init?: RequestInit) { return this.#json<T>(`/api/v1/bridge/history${query ? `?${query}` : ""}`, init); }
  quote<T = Record<string, unknown>>(input: BridgeQuoteRequest, init?: RequestInit) {
    const headers = new Headers(init?.headers);
    if (!headers.has("content-type")) headers.set("content-type", "application/json");
    return this.#json<T>("/api/v1/bridge/quote", { ...init, method: "POST", headers, body: JSON.stringify(input) });
  }
  createTransfer<T = Record<string, unknown>>(input: BridgeTransferCreateRequest, idempotencyKey: string, init?: RequestInit) {
    const headers = new Headers(init?.headers);
    if (!headers.has("content-type")) headers.set("content-type", "application/json");
    headers.set("idempotency-key", idempotencyKey);
    return this.#json<T>("/api/v1/bridge/transfers", { ...init, method: "POST", headers, body: JSON.stringify(input) });
  }
  transfer<T = Record<string, unknown>>(id: string, init?: RequestInit) { return this.#json<T>(`/api/v1/bridge/transfers/${encodeURIComponent(id)}`, init); }
  openapi<T = Record<string, unknown>>(init?: RequestInit) { return this.#json<T>("/api/v1/bridge/openapi", init); }
}
