# PowerChain | DeFAI API Docs

PowerChain DeFAI exposes versioned APIs for shared protocol data, wallet-safe DeFi operations, Bridge settlement orchestration, Swap execution, portfolio/liquidity observations, security policy, and runtime diagnostics.

> Postman is a client and testing surface only. It does not replace wallet signatures, on-chain finality, Wormhole NTT reconciliation, or server-side authorization.

## Production endpoints

| Surface | Base URL | Purpose |
| --- | --- | --- |
| DeFAI/shared API | `https://powerchain.app` | Shared runtime, tokens, currencies, RPC, portfolio, security, market data and common services |
| Swap API | `https://swap.powerchain.app` | `/api/v1/swap/*` execution and quote services |
| Bridge API | `https://bridge.powerchain.app` | `/api/v1/bridge/*` quote, transfer, history, events and runtime services |

The combined Postman collection automatically routes Bridge calls through `{{bridgeUrl}}`, Swap calls through `{{swapUrl}}`, and all other calls through `{{baseUrl}}`.

## Authentication

The OpenAPI contracts define an API-key scheme using the `X-Api-Key` header:

```http
X-Api-Key: {{apiKey}}
```

Runtime policy is controlled server-side by `POWERCHAIN_API_KEY_MODE=off|optional|required`. Never commit production API keys into Postman collections or environments.

## Import into Postman

1. Import `PowerChain-DeFAI.postman_collection.json` for domain-oriented navigation.
2. Import `PowerChain-DeFAI.methods.postman_collection.json` when you want requests grouped explicitly under `GET`, `POST`, and `PUT` folders with saved response examples.
3. Import `PowerChain-DeFAI.local.postman_environment.json` for local development or `PowerChain-DeFAI.production.postman_environment.json` for production hosts.
4. Set the `apiKey` environment variable only when the selected environment requires one.
5. Add test data from `datasets/PowerChain-DeFAI.dataset.csv` when creating a Postman dataset/data source.
6. Use the split collections under `../bridge/postman/` and `../swap/postman/` when you want domain-isolated testing.
7. For schema-first workflows, import `../swagger.yaml`, `../bridge/openapi.yaml`, or `../swap/openapi.yaml` directly into Postman.

Workspace specification reference (requires access to the configured Postman workspace): https://crimson-crescent-8585.postman.co/workspace/55a50a8b-cdb7-46f5-807e-3494d0262565/specification/1afb4b8d-159d-4f42-8805-f1f1a5143539/file/04e6ee61-ea2e-4c44-83c6-51471951a035

## Postman Flow architecture

The visual workflow design for Platform Preflight, Sui Swap, Solana/Jupiter Swap, and Bridge Create & Monitor is documented in `docs/POSTMAN_FLOWS_ARCHITECTURE.md`. It defines Start inputs, Validate/Condition/Evaluate/Delay blocks, request-body mappings, captured variables, and the external wallet-signature boundary.

## Specs, flows and mocks

| Artifact | Path | Purpose |
| --- | --- | --- |
| Specs | `api/postman/specs/PowerChain-DeFAI.postman_specs.json` | Machine-readable action/domain/auth/idempotency inventory |
| Runner flows | `api/postman/flows/PowerChain-DeFAI.flows.postman_collection.json` | Ordered preflight, Swap and Bridge workflows for Collection Runner |
| Flow manifest | `api/postman/flows/PowerChain-DeFAI.flows.json` | Declarative source describing flow steps and safety boundaries |
| Method collection | `api/postman/PowerChain-DeFAI.methods.postman_collection.json` | Requests grouped by HTTP method with sanitized saved response examples |
| Datasets | `api/postman/datasets/` | CSV input for Postman datasets/data-driven runs |
| Mocks | `api/postman/mocks/PowerChain-DeFAI.mocks.postman_collection.json` | Saved examples for Postman mock servers |

Mock fixtures always declare `mock: true` and `authoritativeForBridgeAccounting: false`. A mocked quote, transaction, balance or runtime response is never evidence that a wallet signed, a transaction executed, or Wormhole NTT settled principal.

## Transaction safety

- The connected wallet remains the transaction signer and network-fee payer for wallet-owned Swap and Bridge flows.
- Bridge principal movement remains Wormhole NTT-only; API responses, Postman results, explorer visibility, AI output, and market data are not settlement authority.
- Market prices, rates, pool observations, portfolio data, worker readiness and RPC diagnostics are informational and are never authoritative for Bridge accounting.
- Quote freshness, payer validation, source-balance checks, minimum received and route-specific validation still apply when a transaction is prepared from an API response.

## Core contracts

| Contract | Runtime endpoint | Checked-in contract |
| --- | --- | --- |
| Combined DeFAI | `GET /api/v1/openapi` | `api/swagger.yaml` |
| Bridge | `GET /api/v1/bridge/openapi` | `api/bridge/openapi.yaml` |
| Swap | `GET /api/v1/swap/openapi` | `api/swap/openapi.yaml` |

## Endpoint inventory

### Assets

| Method | Path | Action |
| --- | --- | --- |
| `GET` | `/api/v1/assets/bridge` | `assets.bridge.get` |

### Blockchains

| Method | Path | Action |
| --- | --- | --- |
| `GET` | `/api/v1/blockchains` | `blockchains.get` |

### Bridge

| Method | Path | Action |
| --- | --- | --- |
| `GET` | `/api/v1/bridge/config` | `bridge.config.get` |
| `GET` | `/api/v1/bridge/history` | `bridge.history.get` |
| `GET` | `/api/v1/bridge/openapi` | `bridge.openapi.get` |
| `POST` | `/api/v1/bridge/quote` | `bridge.quote.post` |
| `GET` | `/api/v1/bridge/routes` | `bridge.routes.get` |
| `GET` | `/api/v1/bridge/runtime` | `bridge.runtime.get` |
| `POST` | `/api/v1/bridge/transfers` | `bridge.transfers.post` |
| `GET` | `/api/v1/bridge/transfers/:id` | `bridge.transfers.id.get` |
| `GET` | `/api/v1/bridge/transfers/:id/events` | `bridge.transfers.id.events.get` |
| `GET` | `/api/v1/bridge/transfers/:id/events/stream` | `bridge.transfers.id.events.stream.get` |
| `POST` | `/api/v1/bridge/transfers/:id/source` | `bridge.transfers.id.source.post` |

### Calculators

| Method | Path | Action |
| --- | --- | --- |
| `POST` | `/api/v1/calculators/transaction` | `calculators.transaction.post` |

### Chat

| Method | Path | Action |
| --- | --- | --- |
| `POST` | `/api/v1/chat` | `chat.post` |

### Claims

| Method | Path | Action |
| --- | --- | --- |
| `POST` | `/api/v1/claims/challenge` | `claims.challenge.post` |
| `GET` | `/api/v1/claims/eligibility` | `claims.eligibility.get` |
| `POST` | `/api/v1/claims/reserve` | `claims.reserve.post` |
| `GET` | `/api/v1/claims/status/:id` | `claims.status.id.get` |
| `POST` | `/api/v1/claims/submit` | `claims.submit.post` |

### Clusters

| Method | Path | Action |
| --- | --- | --- |
| `GET` | `/api/v1/clusters` | `clusters.get` |

### Currencies

| Method | Path | Action |
| --- | --- | --- |
| `GET` | `/api/v1/currencies` | `currencies.get` |

### Data

| Method | Path | Action |
| --- | --- | --- |
| `GET` | `/api/v1/data/pwrc` | `data.pwrc.get` |
| `GET` | `/api/v1/data/pwrc/integrity` | `data.pwrc.integrity.get` |
| `GET` | `/api/v1/data/pwrc/snapshot` | `data.pwrc.snapshot.get` |
| `GET` | `/api/v1/data/solana` | `data.solana.get` |
| `GET` | `/api/v1/data/sui` | `data.sui.get` |

### Escrow

| Method | Path | Action |
| --- | --- | --- |
| `GET` | `/api/v1/escrow/readiness` | `escrow.readiness.get` |

### Fees

| Method | Path | Action |
| --- | --- | --- |
| `GET` | `/api/v1/fees/collection-plan` | `fees.collection-plan.get` |
| `GET` | `/api/v1/fees/policy` | `fees.policy.get` |
| `GET` | `/api/v1/fees/token-2022` | `fees.token-2022.get` |

### Health

| Method | Path | Action |
| --- | --- | --- |
| `GET` | `/api/v1/health` | `health.get` |

### Integrations

| Method | Path | Action |
| --- | --- | --- |
| `GET` | `/api/v1/integrations` | `integrations.get` |
| `GET` | `/api/v1/integrations/cetus` | `integrations.cetus.get` |
| `GET` | `/api/v1/integrations/market` | `integrations.market.get` |

### Liquidity

| Method | Path | Action |
| --- | --- | --- |
| `GET` | `/api/v1/liquidity/positions` | `liquidity.positions.get` |
| `GET` | `/api/v1/liquidity/status` | `liquidity.status.get` |

### Market

| Method | Path | Action |
| --- | --- | --- |
| `GET` | `/api/v1/market/prices` | `market.prices.get` |
| `GET` | `/api/v1/market/rates` | `market.rates.get` |
| `GET` | `/api/v1/market/token` | `market.token.get` |

### Metadata

| Method | Path | Action |
| --- | --- | --- |
| `GET` | `/api/v1/metadata/solana` | `metadata.solana.get` |

### Metrics

| Method | Path | Action |
| --- | --- | --- |
| `GET` | `/api/v1/metrics/bridge` | `metrics.bridge.get` |

### Openapi

| Method | Path | Action |
| --- | --- | --- |
| `GET` | `/api/v1/openapi` | `openapi.get` |

### Operations

| Method | Path | Action |
| --- | --- | --- |
| `GET` | `/api/v1/operations/status` | `operations.status.get` |

### Operator

| Method | Path | Action |
| --- | --- | --- |
| `GET` | `/api/v1/operator/fees` | `operator.fees.get` |
| `POST` | `/api/v1/operator/fees` | `operator.fees.post` |
| `GET` | `/api/v1/operator/fees/export` | `operator.fees.export.get` |
| `GET` | `/api/v1/operator/fees/ledger` | `operator.fees.ledger.get` |
| `GET` | `/api/v1/operator/fees/policies` | `operator.fees.policies.get` |
| `POST` | `/api/v1/operator/fees/proposals/:id` | `operator.fees.proposals.id.post` |
| `GET` | `/api/v1/operator/fees/reconciliation` | `operator.fees.reconciliation.get` |
| `GET` | `/api/v1/operator/fees/revenue` | `operator.fees.revenue.get` |
| `POST` | `/api/v1/operator/fees/settlements/:id/reverify` | `operator.fees.settlements.id.reverify.post` |
| `GET` | `/api/v1/operator/maintenance` | `operator.maintenance.get` |
| `PUT` | `/api/v1/operator/maintenance` | `operator.maintenance.put` |
| `GET` | `/api/v1/operator/operations/attention` | `operator.operations.attention.get` |

### Oracles

| Method | Path | Action |
| --- | --- | --- |
| `POST` | `/api/v1/oracles/pyth/sui/updates` | `oracles.pyth.sui.updates.post` |

### Payments

| Method | Path | Action |
| --- | --- | --- |
| `POST` | `/api/v1/payments/checkout` | `payments.checkout.post` |
| `POST` | `/api/v1/payments/solana-pay` | `payments.solana-pay.post` |
| `GET` | `/api/v1/payments/status` | `payments.status.get` |

### Pools

| Method | Path | Action |
| --- | --- | --- |
| `GET` | `/api/v1/pools` | `pools.get` |

### Portfolio

| Method | Path | Action |
| --- | --- | --- |
| `GET` | `/api/v1/portfolio` | `portfolio.get` |

### Programs

| Method | Path | Action |
| --- | --- | --- |
| `GET` | `/api/v1/programs/readiness` | `programs.readiness.get` |
| `GET` | `/api/v1/programs/readiness/:programId` | `programs.readiness.programId.get` |

### Providers

| Method | Path | Action |
| --- | --- | --- |
| `GET` | `/api/v1/providers/diagnostics` | `providers.diagnostics.get` |
| `GET` | `/api/v1/providers/health` | `providers.health.get` |
| `GET` | `/api/v1/providers/readiness` | `providers.readiness.get` |

### Ready

| Method | Path | Action |
| --- | --- | --- |
| `GET` | `/api/v1/ready` | `ready.get` |

### Rpc

| Method | Path | Action |
| --- | --- | --- |
| `GET` | `/api/v1/rpc/status` | `rpc.status.get` |

### Security

| Method | Path | Action |
| --- | --- | --- |
| `GET` | `/api/v1/security/policy` | `security.policy.get` |

### Sessions

| Method | Path | Action |
| --- | --- | --- |
| `POST` | `/api/v1/sessions` | `sessions.post` |

### Staking

| Method | Path | Action |
| --- | --- | --- |
| `GET` | `/api/v1/staking/position` | `staking.position.get` |
| `GET` | `/api/v1/staking/status` | `staking.status.get` |
| `GET` | `/api/v1/staking/transactions/:signature` | `staking.transactions.signature.get` |

### Swap

| Method | Path | Action |
| --- | --- | --- |
| `GET` | `/api/v1/swap/balance` | `swap.balance.get` |
| `GET` | `/api/v1/swap/openapi` | `swap.openapi.get` |
| `POST` | `/api/v1/swap/quote` | `swap.quote.post` |
| `POST` | `/api/v1/swap/receipt` | `swap.receipt.post` |
| `POST` | `/api/v1/swap/solana/execute` | `swap.solana.execute.post` |
| `POST` | `/api/v1/swap/solana/order` | `swap.solana.order.post` |
| `GET` | `/api/v1/swap/solana/provider` | `swap.solana.provider.get` |
| `POST` | `/api/v1/swap/transaction` | `swap.transaction.post` |

### System

| Method | Path | Action |
| --- | --- | --- |
| `GET` | `/api/v1/system/readiness` | `system.readiness.get` |
| `GET` | `/api/v1/system/route-policy` | `system.route-policy.get` |

### Token

| Method | Path | Action |
| --- | --- | --- |
| `GET` | `/api/v1/token/information` | `token.information.get` |

### Tokens

| Method | Path | Action |
| --- | --- | --- |
| `GET` | `/api/v1/tokens/trusted` | `tokens.trusted.get` |

### Transactions

| Method | Path | Action |
| --- | --- | --- |
| `GET` | `/api/v1/transactions/solana/:signature` | `transactions.solana.signature.get` |
| `GET` | `/api/v1/transactions/sui/:digest` | `transactions.sui.digest.get` |

### Version

| Method | Path | Action |
| --- | --- | --- |
| `GET` | `/api/v1/version` | `version.get` |

### Wallet

| Method | Path | Action |
| --- | --- | --- |
| `GET` | `/api/v1/wallet/activity` | `wallet.activity.get` |
| `GET` | `/api/v1/wallet/overview` | `wallet.overview.get` |
| `GET` | `/api/v1/wallet/portfolio` | `wallet.portfolio.get` |
| `GET` | `/api/v1/wallet/solana` | `wallet.solana.get` |
| `GET` | `/api/v1/wallet/solana/pwrc-transfers` | `wallet.solana.pwrc-transfers.get` |
| `GET` | `/api/v1/wallet/sui` | `wallet.sui.get` |

### Workers

| Method | Path | Action |
| --- | --- | --- |
| `GET` | `/api/v1/workers/readiness` | `workers.readiness.get` |

## Regeneration

```bash
pnpm postman:generate
pnpm postman:check
pnpm api:contracts:generate
pnpm api:contracts:check
```

The Postman collection, environments and this API document are generated from repository contracts. Edit the generators or canonical route registry rather than hand-editing generated output.
