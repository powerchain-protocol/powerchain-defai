export interface ApiRouteDefinition { path: string; methods: readonly ("GET" | "POST" | "PUT" | "PATCH" | "DELETE")[]; }

export const API_ROUTES: readonly ApiRouteDefinition[] = [
  {
    "path": "/api/v1/assets/bridge",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/blockchains",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/bridge/config",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/bridge/history",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/bridge/openapi",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/bridge/quote",
    "methods": [
      "POST"
    ]
  },
  {
    "path": "/api/v1/bridge/routes",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/bridge/runtime",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/bridge/transfers",
    "methods": [
      "POST"
    ]
  },
  {
    "path": "/api/v1/bridge/transfers/:id",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/bridge/transfers/:id/events",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/bridge/transfers/:id/events/stream",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/bridge/transfers/:id/source",
    "methods": [
      "POST"
    ]
  },
  {
    "path": "/api/v1/calculators/transaction",
    "methods": [
      "POST"
    ]
  },
  {
    "path": "/api/v1/chat",
    "methods": [
      "POST"
    ]
  },
  {
    "path": "/api/v1/claims/challenge",
    "methods": [
      "POST"
    ]
  },
  {
    "path": "/api/v1/claims/eligibility",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/claims/reserve",
    "methods": [
      "POST"
    ]
  },
  {
    "path": "/api/v1/claims/status/:id",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/claims/submit",
    "methods": [
      "POST"
    ]
  },
  {
    "path": "/api/v1/clusters",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/currencies",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/data/pwrc",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/data/pwrc/integrity",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/data/pwrc/snapshot",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/data/solana",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/data/sui",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/fees/collection-plan",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/fees/policy",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/fees/token-2022",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/health",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/integrations",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/integrations/cetus",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/integrations/market",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/liquidity/positions",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/liquidity/status",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/market/prices",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/market/rates",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/market/token",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/metadata/solana",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/metrics/bridge",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/openapi",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/operations/status",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/operator/fees",
    "methods": [
      "GET",
      "POST"
    ]
  },
  {
    "path": "/api/v1/operator/fees/export",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/operator/fees/ledger",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/operator/fees/policies",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/operator/fees/proposals/:id",
    "methods": [
      "POST"
    ]
  },
  {
    "path": "/api/v1/operator/fees/reconciliation",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/operator/fees/revenue",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/operator/fees/settlements/:id/reverify",
    "methods": [
      "POST"
    ]
  },
  {
    "path": "/api/v1/payments/solana-pay",
    "methods": [
      "POST"
    ]
  },
  {
    "path": "/api/v1/payments/status",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/pools",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/portfolio",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/providers/diagnostics",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/providers/health",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/providers/readiness",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/ready",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/rpc/status",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/security/policy",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/sessions",
    "methods": [
      "POST"
    ]
  },
  {
    "path": "/api/v1/staking/status",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/swap/balance",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/swap/openapi",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/swap/quote",
    "methods": [
      "POST"
    ]
  },
  {
    "path": "/api/v1/swap/receipt",
    "methods": [
      "POST"
    ]
  },
  {
    "path": "/api/v1/swap/solana/execute",
    "methods": [
      "POST"
    ]
  },
  {
    "path": "/api/v1/swap/solana/order",
    "methods": [
      "POST"
    ]
  },
  {
    "path": "/api/v1/swap/transaction",
    "methods": [
      "POST"
    ]
  },
  {
    "path": "/api/v1/token/information",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/tokens/trusted",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/transactions/solana/:signature",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/transactions/sui/:digest",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/version",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/wallet/activity",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/wallet/overview",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/wallet/portfolio",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/wallet/solana",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/wallet/solana/pwrc-transfers",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/wallet/sui",
    "methods": [
      "GET"
    ]
  },
  {
    "path": "/api/v1/workers/readiness",
    "methods": [
      "GET"
    ]
  }
] as const;
