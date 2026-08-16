# @powerchain/backend

`@powerchain/backend` is the single canonical server-side application package for PowerChain DeFAI. There is intentionally no root `/backend` tree.

## Ownership

| Path | Responsibility |
| --- | --- |
| `bridge/` | Wormhole NTT orchestration, finality, reconciliation, auxiliary-program targets |
| `claims/` | eligibility, reservation, payout orchestration, and recovery |
| `fees/` | service-fee policy/verification, reconciliation, Token-2022 fee operations |
| `swap/` | executable Solana/Sui swap transaction construction |
| `integrations/dex/` | Jupiter, Cetus, Raydium, Meteora, and Orca adapters |
| `integrations/` | market, metadata, RPC/provider, and optional marketplace adapters |
| `services/` | transactions, explorer, operations, currencies, prices, rates, RPC, security, calculators, token information |
| `routing/` | canonical API route/risk/rate-limit policies |
| `workers/` | shared worker configuration and heartbeat lifecycle |
| `payments/` | payer policy, Solana Pay, and fail-closed onramp boundaries |
| `data/` | trusted-token and normalized application data registries |
| `config/` | server-owned provider, chain, endpoint, fee, and runtime configuration |
| `types/` | stable server-side domain contracts |
| `utils/` | safe actions, cache, formatting, rate limiting, and reusable helpers |

## Rules

- Provider keys, RPC credentials, treasury secrets, and settlement state stay server-side.
- Browser applications call versioned API routes or explicitly exported browser-safe contracts.
- Worker processes consume backend services instead of owning business logic.
- DEX/market/explorer data is never Bridge settlement authority.
- Wormhole NTT remains the sole cross-chain PWRC/wPWRC principal-movement protocol.

Stable exports should be added through the package export map instead of importing deep source paths from other workspaces.
