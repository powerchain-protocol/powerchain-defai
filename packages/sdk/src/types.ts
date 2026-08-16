export type TokenInformationCommitment = {
  algorithm: "sha256";
  canonicalization: "powerchain-stable-json-v1";
  digest: string;
};
export type PowerChainTokenInformation = {
  schema: "powerchain-token-information/v1";
  version: "1.0.0";
  canonicalAssetId: "powerchain-pwrc";
  name: "PowerChain";
  symbol: "PWRC";
  decimals: 9;
  supply: { model: "fixed"; wholeTokens: string; baseUnits: string };
  solana: { role: "canonical"; standard: "Token-2022"; mint: string; mintAuthorityPolicy: string; freezeAuthorityPolicy: string };
  sui: { role: "wormhole-ntt-representation"; symbol: "wPWRC"; standard: "Sui Coin"; coinTypeSource: "runtime-config"; genesisRepresentationSupply: "0" };
  bridge: { protocol: "Wormhole NTT"; principalRule: "1:1"; auxiliaryContractsMovePrincipal: false };
  fees: { serviceFeesSeparateFromPrincipal: true; networkGasSeparateFromPrincipal: true };
};
export type TokenInformationResponse = {
  information: PowerChainTokenInformation;
  informationCommitment: TokenInformationCommitment;
  runtime: {
    canonicalSolanaMint: string;
    configuredPwrcSolanaMint: string | null;
    configuredWpwrcSuiCoinType: string | null;
    verification: {
      commitment: string;
      algorithm: "sha256";
      canonicalization: "powerchain-stable-json-v1";
      compiledCommitmentMatches: boolean;
      solanaMintMatches: boolean;
      wpwrcCoinTypeConfigured: boolean;
      runtimeVerified: boolean;
      failures: readonly string[];
    };
  };
  authoritativeForBridgeAccounting: false;
};

export type MarketPriceAsset = "SOL" | "SUI" | "PWRC" | "USDC" | "EURC";
export type MarketPricePoint = {
  asset: MarketPriceAsset;
  quote: "USD";
  price: string;
  confidence?: string;
  source: "pyth" | "birdeye";
  publishTime: string;
  ageMs: number;
  stale: boolean;
  authoritativeForBridgeAccounting: false;
};
export type MarketPricesResponse = {
  quote: "USD";
  prices: Array<{ asset: MarketPriceAsset; ok: true; data: MarketPricePoint } | { asset: MarketPriceAsset; ok: false; error: string }>;
  checkedAt: string;
  requestId?: string | null;
  authoritativeForBridgeAccounting: false;
};
export type MarketRateAsset = MarketPriceAsset | "USD";
export type MarketRateResponse = {
  base: MarketRateAsset;
  quote: MarketRateAsset;
  rate: string;
  sources: string[];
  checkedAt: string;
  requestId?: string | null;
  authoritativeForBridgeAccounting: false;
};
export type TransactionCalculatorInput = {
  principalBaseUnits: string;
  quotedOutputBaseUnits: string;
  feeBps: number;
  slippageBps: number;
  minFeeBaseUnits?: string | null;
  maxFeeBaseUnits?: string | null;
};
export type TransactionCalculatorResponse = {
  principalBaseUnits: string;
  feeBaseUnits: string;
  totalDebitBaseUnits: string;
  minimumReceivedBaseUnits: string;
  feeBps: number;
  slippageBps: number;
  requestId?: string | null;
  authoritativeForBridgeAccounting: false;
};
export type PublicSecurityPolicy = {
  maxJsonBodyBytes: number;
  maxQueryValueLength: number;
  requireHttpsInProduction: boolean;
  trustForwardedHeaders: false;
  authoritativeForBridgeAccounting: false;
};

export type DefaiCurrencySymbol = "USD" | "EUR" | "GBP" | "SOL" | "SUI" | "PWRC" | "USDC" | "EURC";
export type DefaiCurrency = { symbol: DefaiCurrencySymbol; name: string; kind: "fiat" | "crypto" | "stablecoin"; decimals: number; quoteCurrency: "USD"; pythSymbol?: string; pythFeedEnv?: string; chains: readonly ("SOLANA" | "SUI" | "OFFCHAIN")[] };
export type CurrenciesResponse = { currencies: DefaiCurrency[]; checkedAt: string; requestId?: string | null; authoritativeForBridgeAccounting: false };
export type RpcEndpointHealth = { id: string; chain: "SOLANA" | "SUI"; role: "primary" | "fallback"; ok: boolean; latencyMs: number; error?: string };
export type RpcStatusResponse = { checkedAt: string; solana: RpcEndpointHealth[]; sui: RpcEndpointHealth[]; requestId?: string | null; authoritativeForBridgeAccounting: false };

export type BlockchainChain = "SOLANA" | "SUI";
export type BlockchainDefinition = { chain: BlockchainChain; name: "Solana" | "Sui"; nativeSymbol: "SOL" | "SUI"; clusterId: string; network: string; environment: "mainnet" | "testnet" | "devnet" | "localnet"; production: boolean; transport: { read: string; realtime: string } };
export type BlockchainResponse = { chains: BlockchainDefinition[]; checkedAt: string; requestId?: string | null; authoritativeForBridgeAccounting: false };
export type ClusterDefinition = { id: string; chain: BlockchainChain; environment: "mainnet" | "testnet" | "devnet" | "localnet"; network: string; production: boolean; nativeSymbol: "SOL" | "SUI"; rpcTransport: "json-rpc" | "grpc-core"; realtimeTransport: "websocket" | "grpc-stream" };
export type CrossChainPair = { direction: "SOLANA_TO_SUI" | "SUI_TO_SOLANA"; sourceChain: BlockchainChain; destinationChain: BlockchainChain };
export type ClustersResponse = { active: BlockchainDefinition[]; supported: ClusterDefinition[]; crossChainPairs: CrossChainPair[]; principalMovementProtocol: "wormhole-ntt"; checkedAt: string; requestId?: string | null; authoritativeForBridgeAccounting: false };
