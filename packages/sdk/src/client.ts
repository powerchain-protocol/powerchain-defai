import { BridgeApiClient } from "./bridge-client";
import { SwapApiClient } from "./swap-client";
import { GeneratedApiClient, type ApiHeadersFactory } from "./api-client";
import { POWERCHAIN_INFORMATION_COMMITMENT } from "@powerchain/protocol";
import type { BlockchainResponse, ClustersResponse, CurrenciesResponse, MarketPriceAsset, MarketPricesResponse, MarketRateAsset, MarketRateResponse, PublicSecurityPolicy, RpcStatusResponse, TokenInformationResponse, TransactionCalculatorInput, TransactionCalculatorResponse } from "./types";

export type PowerChainClientOptions = { baseUrl?: string; fetch?: typeof globalThis.fetch; headers?: ApiHeadersFactory };

export class PowerChainClient {
  readonly api: GeneratedApiClient;
  readonly bridge: BridgeApiClient;
  readonly swap: SwapApiClient;
  readonly #baseUrl: string;
  readonly #fetch: typeof globalThis.fetch;
  readonly #headers: ApiHeadersFactory | undefined;

  constructor(options: PowerChainClientOptions = {}) {
    this.#baseUrl = (options.baseUrl ?? "").replace(/\/$/, "");
    this.#fetch = options.fetch ?? globalThis.fetch.bind(globalThis);
    this.#headers = options.headers;
    const shared = {
      baseUrl: this.#baseUrl,
      fetch: this.#fetch,
      ...(this.#headers ? { headers: this.#headers } : {}),
    };
    this.api = new GeneratedApiClient(shared);
    this.bridge = new BridgeApiClient(shared);
    this.swap = new SwapApiClient(shared);
  }

  async #baseHeaders(): Promise<HeadersInit | undefined> {
    return typeof this.#headers === "function" ? await this.#headers() : this.#headers;
  }

  async #json<T>(path: string, init?: RequestInit, errorPrefix = "POWERCHAIN_API_HTTP"): Promise<T> {
    const headers = new Headers(await this.#baseHeaders());
    new Headers(init?.headers).forEach((value, key) => headers.set(key, value));
    if (!headers.has("accept")) headers.set("accept", "application/json");
    const response = await this.#fetch(`${this.#baseUrl}${path}`, { ...init, headers });
    if (!response.ok) throw new Error(`${errorPrefix}_${response.status}`);
    return await response.json() as T;
  }

  async tokenInformation(init?: RequestInit): Promise<TokenInformationResponse> {
    const payload = await this.#json<TokenInformationResponse>("/api/v1/token/information", init, "POWERCHAIN_TOKEN_INFORMATION_HTTP");
    if (payload.informationCommitment.digest !== POWERCHAIN_INFORMATION_COMMITMENT) throw new Error("POWERCHAIN_INFORMATION_COMMITMENT_MISMATCH");
    return payload;
  }
  currencies(init?: RequestInit): Promise<CurrenciesResponse> { return this.#json("/api/v1/currencies", init, "POWERCHAIN_CURRENCIES_HTTP"); }
  rpcStatus(init?: RequestInit): Promise<RpcStatusResponse> { return this.#json("/api/v1/rpc/status", init, "POWERCHAIN_RPC_STATUS_HTTP"); }
  prices(assets: readonly MarketPriceAsset[] = ["SOL", "SUI", "PWRC", "USDC", "EURC"], init?: RequestInit): Promise<MarketPricesResponse> {
    const query = new URLSearchParams({ assets: [...new Set(assets)].slice(0, 5).join(",") });
    return this.#json(`/api/v1/market/prices?${query}`, init, "POWERCHAIN_MARKET_PRICES_HTTP");
  }
  rate(base: MarketRateAsset, quote: MarketRateAsset, init?: RequestInit): Promise<MarketRateResponse> {
    const query = new URLSearchParams({ base, quote });
    return this.#json(`/api/v1/market/rates?${query}`, init, "POWERCHAIN_MARKET_RATE_HTTP");
  }
  calculateTransaction(input: TransactionCalculatorInput, init?: RequestInit): Promise<TransactionCalculatorResponse> {
    const headers = new Headers(init?.headers);
    if (!headers.has("content-type")) headers.set("content-type", "application/json");
    return this.#json("/api/v1/calculators/transaction", { ...init, method: "POST", headers, body: JSON.stringify(input) }, "POWERCHAIN_TRANSACTION_CALCULATOR_HTTP");
  }
  securityPolicy(init?: RequestInit): Promise<PublicSecurityPolicy> { return this.#json("/api/v1/security/policy", init, "POWERCHAIN_SECURITY_POLICY_HTTP"); }
  blockchains(init?: RequestInit): Promise<BlockchainResponse> { return this.#json("/api/v1/blockchains", init, "POWERCHAIN_BLOCKCHAINS_HTTP"); }
  clusters(init?: RequestInit): Promise<ClustersResponse> { return this.#json("/api/v1/clusters", init, "POWERCHAIN_CLUSTERS_HTTP"); }
}
