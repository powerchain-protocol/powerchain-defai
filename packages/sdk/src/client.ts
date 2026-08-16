import { BridgeApiClient } from "./bridge-client";
import { SwapApiClient } from "./swap-client";
import { POWERCHAIN_INFORMATION_COMMITMENT } from "@powerchain/protocol";
import type { BlockchainResponse, ClustersResponse, CurrenciesResponse, MarketPriceAsset, MarketPricesResponse, MarketRateAsset, MarketRateResponse, PublicSecurityPolicy, RpcStatusResponse, TokenInformationResponse, TransactionCalculatorInput, TransactionCalculatorResponse } from "./types";

export type PowerChainClientOptions = { baseUrl?: string; fetch?: typeof globalThis.fetch };

export class PowerChainClient {
  readonly bridge: BridgeApiClient;
  readonly swap: SwapApiClient;
  readonly #baseUrl: string;
  readonly #fetch: typeof globalThis.fetch;
  constructor(options: PowerChainClientOptions = {}) {
    this.#baseUrl = (options.baseUrl ?? "").replace(/\/$/, "");
    this.#fetch = options.fetch ?? globalThis.fetch.bind(globalThis);
    this.bridge = new BridgeApiClient({ baseUrl: this.#baseUrl, fetch: this.#fetch });
    this.swap = new SwapApiClient({ baseUrl: this.#baseUrl, fetch: this.#fetch });
  }
  async tokenInformation(init?: RequestInit): Promise<TokenInformationResponse> {
    const response = await this.#fetch(`${this.#baseUrl}/api/v1/token/information`, { ...init, headers: { accept: "application/json", ...(init?.headers ?? {}) } });
    if (!response.ok) throw new Error(`POWERCHAIN_TOKEN_INFORMATION_HTTP_${response.status}`);
    const payload = await response.json() as TokenInformationResponse;
    if (payload.informationCommitment.digest !== POWERCHAIN_INFORMATION_COMMITMENT) throw new Error("POWERCHAIN_INFORMATION_COMMITMENT_MISMATCH");
    return payload;
  }
  async currencies(init?: RequestInit): Promise<CurrenciesResponse> {
    const response = await this.#fetch(`${this.#baseUrl}/api/v1/currencies`, { ...init, headers: { accept: "application/json", ...(init?.headers ?? {}) } });
    if (!response.ok) throw new Error(`POWERCHAIN_CURRENCIES_HTTP_${response.status}`);
    return await response.json() as CurrenciesResponse;
  }
  async rpcStatus(init?: RequestInit): Promise<RpcStatusResponse> {
    const response = await this.#fetch(`${this.#baseUrl}/api/v1/rpc/status`, { ...init, headers: { accept: "application/json", ...(init?.headers ?? {}) } });
    if (!response.ok) throw new Error(`POWERCHAIN_RPC_STATUS_HTTP_${response.status}`);
    return await response.json() as RpcStatusResponse;
  }
  async prices(assets: readonly MarketPriceAsset[] = ["SOL", "SUI", "PWRC", "USDC", "EURC"], init?: RequestInit): Promise<MarketPricesResponse> {
    const query = new URLSearchParams({ assets: [...new Set(assets)].slice(0, 5).join(",") });
    const response = await this.#fetch(`${this.#baseUrl}/api/v1/market/prices?${query}`, { ...init, headers: { accept: "application/json", ...(init?.headers ?? {}) } });
    if (!response.ok) throw new Error(`POWERCHAIN_MARKET_PRICES_HTTP_${response.status}`);
    return await response.json() as MarketPricesResponse;
  }
  async rate(base: MarketRateAsset, quote: MarketRateAsset, init?: RequestInit): Promise<MarketRateResponse> {
    const query = new URLSearchParams({ base, quote });
    const response = await this.#fetch(`${this.#baseUrl}/api/v1/market/rates?${query}`, { ...init, headers: { accept: "application/json", ...(init?.headers ?? {}) } });
    if (!response.ok) throw new Error(`POWERCHAIN_MARKET_RATE_HTTP_${response.status}`);
    return await response.json() as MarketRateResponse;
  }
  async calculateTransaction(input: TransactionCalculatorInput, init?: RequestInit): Promise<TransactionCalculatorResponse> {
    const response = await this.#fetch(`${this.#baseUrl}/api/v1/calculators/transaction`, { ...init, method: "POST", headers: { "content-type": "application/json", accept: "application/json", ...(init?.headers ?? {}) }, body: JSON.stringify(input) });
    if (!response.ok) throw new Error(`POWERCHAIN_TRANSACTION_CALCULATOR_HTTP_${response.status}`);
    return await response.json() as TransactionCalculatorResponse;
  }
  async securityPolicy(init?: RequestInit): Promise<PublicSecurityPolicy> {
    const response = await this.#fetch(`${this.#baseUrl}/api/v1/security/policy`, { ...init, headers: { accept: "application/json", ...(init?.headers ?? {}) } });
    if (!response.ok) throw new Error(`POWERCHAIN_SECURITY_POLICY_HTTP_${response.status}`);
    return await response.json() as PublicSecurityPolicy;
  }

  async blockchains(init?: RequestInit): Promise<BlockchainResponse> {
    const response = await this.#fetch(`${this.#baseUrl}/api/v1/blockchains`, { ...init, headers: { accept: "application/json", ...(init?.headers ?? {}) } });
    if (!response.ok) throw new Error(`POWERCHAIN_BLOCKCHAINS_HTTP_${response.status}`);
    return await response.json() as BlockchainResponse;
  }
  async clusters(init?: RequestInit): Promise<ClustersResponse> {
    const response = await this.#fetch(`${this.#baseUrl}/api/v1/clusters`, { ...init, headers: { accept: "application/json", ...(init?.headers ?? {}) } });
    if (!response.ok) throw new Error(`POWERCHAIN_CLUSTERS_HTTP_${response.status}`);
    return await response.json() as ClustersResponse;
  }

}
