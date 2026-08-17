# API

The browser-facing API is versioned under `/api/v1`. `GET /api/v1/openapi` returns the current OpenAPI JSON contract. `api/swagger.yaml` is checked in under the root API-contract directory for tooling that consumes YAML.

New integration surfaces include `/api/v1/integrations/market`, `/api/v1/market/token`, `/api/v1/metadata/solana`, `/api/v1/payments/status`, `/api/v1/payments/solana-pay`, and `/api/v1/sessions`. Session IDs are correlation identifiers only and are not wallet authentication. Wallet identity remains signature-bound.

## Postman workflow architecture

See [Postman Flows Architecture](POSTMAN_FLOWS_ARCHITECTURE.md) for the master preflight, Sui Swap, Solana/Jupiter Swap, and Bridge Create & Monitor workflows, including typed Start inputs and wallet-signature boundaries.

### Staking position

`GET /api/v1/staking/position?wallet=<SOLANA_ADDRESS>` is a read-only, fail-closed position lookup. It requires the Solana staking deployment to be runtime verified, derives the wallet-owned position PDA, validates its program owner, Anchor discriminator and embedded wallet owner, and returns active stake, pending unstake, recorded rewards, current slot and cooldown readiness. It never signs or submits a transaction.
