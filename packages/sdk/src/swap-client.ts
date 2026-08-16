import type { SwapChain, SwapQuoteProtection } from "@powerchain/swap-core";
export type SwapApiClientOptions = { baseUrl: string; fetch: typeof globalThis.fetch };
export type SuiSwapQuoteRequest = { chain?: Extract<SwapChain, "SUI">; payer: string; fromCoinType: string; toCoinType: string; amountBaseUnits: string; slippageBps: number };
export type SolanaSwapOrderRequest = { chain?: Extract<SwapChain, "SOLANA">; payer: string; inputMint: string; outputMint: string; amountBaseUnits: string; slippageBps: number };
export type SwapProtection = SwapQuoteProtection;

export class SwapApiClient {
  readonly #baseUrl: string; readonly #fetch: typeof globalThis.fetch;
  constructor(options: SwapApiClientOptions) { this.#baseUrl = options.baseUrl.replace(/\/$/, ""); this.#fetch = options.fetch; }
  async #json<T>(path: string, init?: RequestInit): Promise<T> { const response = await this.#fetch(`${this.#baseUrl}${path}`, { ...init, headers: { accept: "application/json", ...(init?.headers ?? {}) } }); if (!response.ok) throw new Error(`POWERCHAIN_SWAP_HTTP_${response.status}`); return await response.json() as T; }
  balance<T = Record<string, unknown>>(query: URLSearchParams | string, init?: RequestInit) { const value = typeof query === "string" ? query : query.toString(); return this.#json<T>(`/api/v1/swap/balance?${value}`, init); }
  quote<T = Record<string, unknown>>(input: SuiSwapQuoteRequest, init?: RequestInit) { return this.#json<T>("/api/v1/swap/quote", { ...init, method: "POST", headers: { "content-type": "application/json", ...(init?.headers ?? {}) }, body: JSON.stringify(input) }); }
  transaction<T = Record<string, unknown>>(input: Record<string, unknown>, init?: RequestInit) { return this.#json<T>("/api/v1/swap/transaction", { ...init, method: "POST", headers: { "content-type": "application/json", ...(init?.headers ?? {}) }, body: JSON.stringify(input) }); }
  solanaOrder<T = Record<string, unknown>>(input: SolanaSwapOrderRequest, init?: RequestInit) { return this.#json<T>("/api/v1/swap/solana/order", { ...init, method: "POST", headers: { "content-type": "application/json", ...(init?.headers ?? {}) }, body: JSON.stringify(input) }); }
  solanaExecute<T = Record<string, unknown>>(input: Record<string, unknown>, init?: RequestInit) { return this.#json<T>("/api/v1/swap/solana/execute", { ...init, method: "POST", headers: { "content-type": "application/json", ...(init?.headers ?? {}) }, body: JSON.stringify(input) }); }
  openapi<T = Record<string, unknown>>(init?: RequestInit) { return this.#json<T>("/api/v1/swap/openapi", init); }
}
