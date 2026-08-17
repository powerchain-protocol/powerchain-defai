import type { GeneratedApiPath } from "./generated/api-routes";

export type ApiHeadersFactory = HeadersInit | (() => HeadersInit | Promise<HeadersInit>);
export type GeneratedApiClientOptions = Readonly<{ baseUrl?: string; fetch?: typeof globalThis.fetch; headers?: ApiHeadersFactory }>;

export function buildApiPath(template: GeneratedApiPath, params: Readonly<Record<string, string | number>>): string {
  return template.replace(/:([A-Za-z0-9_]+)/g, (_match, key: string) => {
    const value = params[key];
    if (value === undefined || value === null || String(value).length === 0) throw new Error(`POWERCHAIN_API_PATH_PARAM_REQUIRED:${key}`);
    return encodeURIComponent(String(value));
  });
}

export class GeneratedApiClient {
  readonly #baseUrl: string;
  readonly #fetch: typeof globalThis.fetch;
  readonly #headers: ApiHeadersFactory | undefined;
  constructor(options: GeneratedApiClientOptions = {}) {
    this.#baseUrl = (options.baseUrl ?? "").replace(/\/$/, "");
    this.#fetch = options.fetch ?? globalThis.fetch.bind(globalThis);
    this.#headers = options.headers;
  }
  async #baseHeaders() { return typeof this.#headers === "function" ? await this.#headers() : this.#headers; }
  async request<T = Record<string, unknown>>(path: GeneratedApiPath | string, init: RequestInit = {}): Promise<T> {
    if (!path.startsWith("/api/v1/")) throw new Error("POWERCHAIN_API_PATH_INVALID");
    const headers = new Headers(await this.#baseHeaders());
    new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    if (!headers.has("accept")) headers.set("accept", "application/json");
    const response = await this.#fetch(`${this.#baseUrl}${path}`, { ...init, headers });
    if (!response.ok) throw new Error(`POWERCHAIN_API_HTTP_${response.status}`);
    return await response.json() as T;
  }
  get<T = Record<string, unknown>>(path: GeneratedApiPath | string, init?: RequestInit) { return this.request<T>(path, { ...init, method: "GET" }); }
  post<T = Record<string, unknown>>(path: GeneratedApiPath | string, body: unknown, init?: RequestInit) {
    const headers = new Headers(init?.headers);
    if (!headers.has("content-type")) headers.set("content-type", "application/json");
    return this.request<T>(path, { ...init, method: "POST", headers, body: JSON.stringify(body) });
  }
}
