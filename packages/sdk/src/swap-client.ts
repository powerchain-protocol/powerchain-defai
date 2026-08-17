import type { SwapChain, SwapQuoteProtection } from "@powerchain/swap-core";
import type { ApiHeadersFactory } from "./api-client";

export type SwapApiClientOptions = { baseUrl: string; fetch: typeof globalThis.fetch; headers?: ApiHeadersFactory };
export type SuiSwapQuoteRequest = { chain?: Extract<SwapChain, "SUI">; payer: string; fromCoinType: string; toCoinType: string; amountBaseUnits: string; slippageBps: number };
export type SolanaSwapOrderRequest = { chain?: Extract<SwapChain, "SOLANA">; payer: string; inputMint: string; outputMint: string; amountBaseUnits: string; slippageBps: number };
export type SwapProtection = SwapQuoteProtection;
export type JupiterClientOverride = Readonly<{ apiKey?: string; apiUrl?: string }>;

const JUPITER_KEY_HEADER = "x-powerchain-jupiter-api-key";
const JUPITER_URL_HEADER = "x-powerchain-jupiter-api-url";

function withJupiterOverride(init: RequestInit | undefined, override: JupiterClientOverride): RequestInit {
  const headers = new Headers(init?.headers);
  if (override.apiKey?.trim()) headers.set(JUPITER_KEY_HEADER, override.apiKey.trim());
  if (override.apiUrl?.trim()) headers.set(JUPITER_URL_HEADER, override.apiUrl.trim());
  return { ...init, headers };
}

export class SwapApiClient {
  readonly #baseUrl: string;
  readonly #fetch: typeof globalThis.fetch;
  readonly #headers: ApiHeadersFactory | undefined;

  constructor(options: SwapApiClientOptions) {
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
    if (!response.ok) throw new Error(`POWERCHAIN_SWAP_HTTP_${response.status}`);
    return await response.json() as T;
  }

  balance<T = Record<string, unknown>>(query: URLSearchParams | string, init?: RequestInit) { const value = typeof query === "string" ? query : query.toString(); return this.#json<T>(`/api/v1/swap/balance?${value}`, init); }
  #post<T>(path: string, input: unknown, init?: RequestInit) {
    const headers = new Headers(init?.headers);
    if (!headers.has("content-type")) headers.set("content-type", "application/json");
    return this.#json<T>(path, { ...init, method: "POST", headers, body: JSON.stringify(input) });
  }
  quote<T = Record<string, unknown>>(input: SuiSwapQuoteRequest, init?: RequestInit) { return this.#post<T>("/api/v1/swap/quote", input, init); }
  transaction<T = Record<string, unknown>>(input: Record<string, unknown>, init?: RequestInit) { return this.#post<T>("/api/v1/swap/transaction", input, init); }
  solanaProvider<T = Record<string, unknown>>(init?: RequestInit) { return this.#json<T>("/api/v1/swap/solana/provider", init); }
  solanaProviderWithJupiter<T = Record<string, unknown>>(override: JupiterClientOverride, init?: RequestInit) { return this.solanaProvider<T>(withJupiterOverride(init, override)); }
  solanaOrder<T = Record<string, unknown>>(input: SolanaSwapOrderRequest, init?: RequestInit) { return this.#post<T>("/api/v1/swap/solana/order", input, init); }
  solanaExecute<T = Record<string, unknown>>(input: Record<string, unknown>, init?: RequestInit) { return this.#post<T>("/api/v1/swap/solana/execute", input, init); }
  solanaOrderWithJupiter<T = Record<string, unknown>>(input: SolanaSwapOrderRequest, override: JupiterClientOverride, init?: RequestInit) { return this.solanaOrder<T>(input, withJupiterOverride(init, override)); }
  solanaExecuteWithJupiter<T = Record<string, unknown>>(input: Record<string, unknown>, override: JupiterClientOverride, init?: RequestInit) { return this.solanaExecute<T>(input, withJupiterOverride(init, override)); }
  openapi<T = Record<string, unknown>>(init?: RequestInit) { return this.#json<T>("/api/v1/swap/openapi", init); }
}
