export const OPENAPI = {
  openapi: "3.1.0",
  info: {
    title: "PowerChain DeFAI API",
    version: "1.0.0",
    description: "Browser-safe API for PowerChain DeFAI assistant, swap, bridge, staking, pools, portfolio, token information, market data and provider status. AI is advisory-only and Wormhole NTT remains the bridge principal-movement protocol.",
  },
  servers: [{ url: "/" }],
  security: [{ ApiKey: [] }],
  paths: {
    "/api/v1/chat": { post: { summary: "Advisory-only PowerChain DeFAI assistant", responses: { "200": { description: "Read-only assistant response; executable actions still require wallet signature" } } } },
    "/api/v1/staking/status": { get: { summary: "Deployment-gated staking readiness", responses: { "200": { description: "Configured/disabled Solana and Sui staking status without fabricated APR" } } } },
    "/api/v1/token/information": { get: { summary: "Canonical PWRC/wPWRC token information commitment and runtime verification", responses: { "200": { description: "Commitment verified" }, "503": { description: "Runtime token information verification failed" } } } },
    "/api/v1/bridge/runtime": { get: { summary: "Bridge runtime readiness including token information commitment verification", responses: { "200": { description: "Ready or degraded runtime" }, "503": { description: "Blocking runtime verification failed" } } } },
    "/api/v1/operations/status": { get: { summary: "Database, worker heartbeat, and queue operational readiness", responses: { "200": { description: "Healthy or degraded operational snapshot" }, "503": { description: "Operational backend blocked or unavailable" } } } },
    "/api/v1/bridge/history": { get: { summary: "Persisted bridge transaction history", responses: { "200": { description: "Cursor-paginated persisted bridge transactions" }, "400": { description: "Invalid transfer status filter" } } } },
    "/api/v1/tokens/trusted": { get: { summary: "Trusted token registry", responses: { "200": { description: "Trusted tokens" } } } },
    "/api/v1/pools": { get: { summary: "Normalized DEX pools", responses: { "200": { description: "Pool observations" } } } },
    "/api/v1/portfolio": { get: { summary: "Connected wallet portfolio", responses: { "200": { description: "Portfolio balances" } } } },
    "/api/v1/swap/solana/order": { post: { summary: "Build Jupiter Swap V2 order", responses: { "200": { description: "Unsigned wallet-owned swap transaction" } } } },
    "/api/v1/swap/solana/execute": { post: { summary: "Submit signed Jupiter Swap V2 transaction", responses: { "200": { description: "Execution result" } } } },
    "/api/v1/swap/receipt": { post: { summary: "Persist a wallet-submitted swap receipt", responses: { "201": { description: "Submission receipt persisted" } } } },
    "/api/v1/swap/quote": { post: { summary: "Build Sui Cetus quote", responses: { "200": { description: "Cetus quote" } } } },
    "/api/v1/bridge/quote": { post: { summary: "Bridge quote", responses: { "200": { description: "Wormhole NTT bridge quote" } } } },
    "/api/v1/bridge/config": { get: { summary: "Browser-safe Bridge configuration", responses: { "200": { description: "Bridge configuration" } } } },
    "/api/v1/bridge/routes": { get: { summary: "Supported Bridge routes", responses: { "200": { description: "Wormhole NTT routes" } } } },
    "/api/v1/bridge/transfers": { post: { summary: "Create persisted Bridge transfer", responses: { "201": { description: "Transfer created" } } } },
    "/api/v1/bridge/transfers/{id}": { get: { summary: "Bridge transfer status", responses: { "200": { description: "Persisted transfer status" } } } },
    "/api/v1/bridge/transfers/{id}/events": { get: { summary: "Bridge transfer events", responses: { "200": { description: "Persisted transfer events" } } } },
    "/api/v1/bridge/transfers/{id}/events/stream": { get: { summary: "Bridge transfer event stream", responses: { "200": { description: "Server-sent event stream" } } } },
    "/api/v1/bridge/transfers/{id}/source": { post: { summary: "Attach source transaction", responses: { "200": { description: "Source transaction attached" } } } },
    "/api/v1/swap/balance": { get: { summary: "Trusted source-asset balance preflight", responses: { "200": { description: "Connected-wallet balance" } } } },
    "/api/v1/swap/transaction": { post: { summary: "Build unsigned Sui Cetus swap transaction", responses: { "200": { description: "Unsigned wallet-owned transaction" } } } },
    "/api/v1/integrations": { get: { summary: "Integration status", responses: { "200": { description: "Server provider readiness without secrets" } } } },
    "/api/v1/market/token": { get: { summary: "Token market-data proxy", responses: { "200": { description: "Non-authoritative market data" } } } },
    "/api/v1/currencies": { get: { summary: "Supported DeFAI currencies and Pyth feed metadata", responses: { "200": { description: "Browser-safe currency registry" } } } },
    "/api/v1/blockchains": { get: { summary: "Active Solana and Sui blockchain runtime contexts", responses: { "200": { description: "Browser-safe active chain and cluster metadata" } } } },
    "/api/v1/clusters": { get: { summary: "Supported Solana/Sui cluster registry and cross-chain pairs", responses: { "200": { description: "Supported cluster metadata; Wormhole NTT remains principal-movement protocol" } } } },
    "/api/v1/rpc/status": { get: { summary: "Solana RPC and Sui gRPC endpoint readiness", responses: { "200": { description: "Non-authoritative RPC readiness" }, "503": { description: "RPC provider unavailable" } } } },
    "/api/v1/market/prices": { get: { summary: "Validated SOL/SUI/PWRC/USDC/EURC USD prices", responses: { "200": { description: "Fresh non-authoritative price observations" }, "503": { description: "No fresh configured price source available" } } } },
    "/api/v1/market/rates": { get: { summary: "Derived cross-asset rates from validated USD price observations", responses: { "200": { description: "Non-authoritative cross rate" }, "400": { description: "Unsupported rate pair" } } } },
    "/api/v1/calculators/transaction": { post: { summary: "Exact base-unit fee and slippage calculator", responses: { "200": { description: "Deterministic transaction amounts" }, "400": { description: "Invalid calculator input" } } } },
    "/api/v1/security/policy": { get: { summary: "Browser-safe API request security policy", responses: { "200": { description: "Public bounded request policy without secrets" } } } },
    "/api/v1/metadata/solana": { get: { summary: "Solana token/asset metadata", responses: { "200": { description: "Helius DAS plus Metaplex PDA" } } } },
    "/api/v1/payments/status": { get: { summary: "Onramp provider configuration status", responses: { "200": { description: "Provider readiness" } } } },
    "/api/v1/payments/solana-pay": { post: { summary: "Build Solana Pay transfer URL", responses: { "200": { description: "Solana Pay URL" } } } },
  },
  components: {
    securitySchemes: {
      ApiKey: { type: "apiKey", in: "header", name: "X-Api-Key", description: "PowerChain API key. Runtime enforcement is controlled by POWERCHAIN_API_KEY_MODE." },
    },
    schemas: {
      TokenInformationCommitment: {
        type: "object",
        required: ["algorithm", "canonicalization", "digest"],
        properties: {
          algorithm: { const: "sha256" },
          canonicalization: { const: "powerchain-stable-json-v1" },
          digest: { type: "string", pattern: "^[0-9a-f]{64}$" },
        },
      },
    },
  },
} as const;

function splitContract(prefix: "/api/v1/bridge" | "/api/v1/swap", title: string, description: string) {
  const paths = Object.fromEntries(Object.entries(OPENAPI.paths).filter(([path]) => path.startsWith(prefix)));
  return {
    ...OPENAPI,
    info: { ...OPENAPI.info, title, description },
    paths,
  };
}

export const BRIDGE_OPENAPI = splitContract(
  "/api/v1/bridge",
  "PowerChain Bridge API",
  "Bridge-only API contract. Wormhole NTT is the sole PWRC/wPWRC cross-chain principal-movement protocol.",
);

export const SWAP_OPENAPI = splitContract(
  "/api/v1/swap",
  "PowerChain Swap API",
  "Swap-only API contract for wallet-owned Solana Jupiter and Sui Cetus execution. Swap routing is not bridge settlement authority.",
);
