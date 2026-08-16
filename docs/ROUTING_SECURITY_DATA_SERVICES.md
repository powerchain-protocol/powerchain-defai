# Routing, security and data services

PowerChain DeFAI keeps reusable API policy and financial math in `apps/backend` so application routes stay thin and do not duplicate validation or provider logic.

## Routing ownership

`apps/backend/src/routing/` defines versioned core routes, risk classes and rate-limit classes. `apps/bridge/server/routing/api-router.ts` is the Next.js adapter that resolves those policies and applies bounded request IDs and per-route in-memory burst protection. Durable abuse controls already used by sensitive application routes remain independent of this convenience layer.

A route policy does not authenticate a wallet. Wallet-write operations must still validate the connected wallet, payer and signature in their domain service.

## Security boundary

`services/security.ts` centralizes browser-safe request limits and public error-code sanitation. It deliberately does not trust forwarded headers as identity and does not expose secrets. The public `/api/v1/security/policy` endpoint contains only safe limits.

## Prices and rates

`services/prices.ts` owns SOL, SUI and PWRC/USD price observations. Pyth is the primary configured feed. PWRC can fall back to Birdeye when configured. Freshness is bounded and market data is always marked `authoritativeForBridgeAccounting: false`.

`services/rates.ts` derives cross rates from validated USD observations with fixed-point integer arithmetic. Rates are informational for UI/analytics and are not Bridge settlement evidence.

## Calculators

`services/calculators.ts` performs deterministic integer/base-unit arithmetic for service fees, total source debit and minimum received after slippage. It never performs floating-point token accounting.

The calculator API does not create a quote, transaction or authorization. Executable Swap and Bridge paths still require fresh domain validation and connected-wallet approval.
