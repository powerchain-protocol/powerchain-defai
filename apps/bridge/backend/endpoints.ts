export const BRIDGE_API_ENDPOINTS = Object.freeze({
  operator: Object.freeze({ attention: "/api/v1/operator/operations/attention", maintenance: "/api/v1/operator/maintenance" }),
  system: Object.freeze({
    routePolicy: "/api/v1/system/route-policy",
    readiness: "/api/v1/system/readiness",
  }),
  programs: Object.freeze({
    readiness: "/api/v1/programs/readiness",
    readinessItem: (programId: string) => `/api/v1/programs/readiness/${encodeURIComponent(programId)}`,
  }),
  providers: Object.freeze({
    health: "/api/v1/providers/health",
    readiness: "/api/v1/providers/readiness",
    diagnostics: "/api/v1/providers/diagnostics",
  }),
  realtime: Object.freeze({
    stream: "/api/v1/realtime",
    events: "/api/v1/events",
  }),
  payments: Object.freeze({
    solanaPay: "/api/v1/payments/solana-pay",
    checkout: "/api/v1/payments/checkout",
  }),
  escrow: Object.freeze({
    readiness: "/api/v1/escrow/readiness",
  }),
  staking: Object.freeze({
    status: "/api/v1/staking/status",
    position: "/api/v1/staking/position",
    transactions: "/api/v1/staking/transactions",
  }),
} as const);
