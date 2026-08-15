export interface ApiRouteDefinition { path: string; methods: readonly ("GET" | "POST" | "PUT" | "PATCH" | "DELETE")[]; }

export const API_ROUTES: readonly ApiRouteDefinition[] = [
  {
    "path": "/api/v1/assets/bridge",
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
    "path": "/api/v1/bridge/quote",
    "methods": [
      "POST"
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
    "path": "/api/v1/bridge/transfers/:id/source",
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
    "path": "/api/v1/market/prices",
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
