# PowerChain DeFAI API Contracts

The root `api/` workspace contains checked-in release/client contracts. Executable handlers remain in the Next.js application under `apps/bridge/app/api/v1/`.

```text
api/
├── swagger.yaml
├── postman/
├── bridge/
│   ├── openapi.yaml
│   └── postman/
└── swap/
    ├── openapi.yaml
    └── postman/
```

## Contracts

- `api/swagger.yaml` — combined DeFAI/shared-service OpenAPI contract.
- `api/bridge/openapi.yaml` — Bridge-only `/api/v1/bridge/*` contract.
- `api/swap/openapi.yaml` — Swap-only `/api/v1/swap/*` contract.
- `api/postman/` — generated combined collection, local/production environments, and **PowerChain | DeFAI API Docs** (`API_DOCS.md`).
- `api/bridge/postman/` and `api/swap/postman/` — generated domain-specific collections.
- `shared/actions.json` — canonical generated action registry used by contract tooling.

Runtime OpenAPI endpoints are:

```text
GET /api/v1/openapi
GET /api/v1/bridge/openapi
GET /api/v1/swap/openapi
```

Bridge and Swap share security, RPC, currencies, wallet validation, trusted tokens, and cluster primitives, but their transaction state machines and contracts remain separate.

## Authentication

OpenAPI contracts define:

```yaml
security:
  - ApiKey: []

components:
  securitySchemes:
    ApiKey:
      type: apiKey
      in: header
      name: X-Api-Key
```

Runtime enforcement is configured by `POWERCHAIN_API_KEY_MODE=off|optional|required` and server-only `POWERCHAIN_API_KEYS`.

## Tooling

```bash
pnpm api:contracts:generate
pnpm api:contracts:check
pnpm postman:generate
pnpm postman:check
pnpm routes:check
```

Never store private keys, wallet signing material, RPC/API credentials, or runtime `.env` files under `api/`.
