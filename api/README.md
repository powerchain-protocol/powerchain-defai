# PowerChain DeFAI API

The `api/` workspace contains generated release/client contracts for the executable Next.js handlers under `apps/bridge/app/api/v1/`. The **filesystem route registry is canonical**; checked-in OpenAPI, SDK registry and Postman artifacts must be regenerated from it rather than edited independently.

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

## Runtime contracts

```text
GET /api/v1/openapi
GET /api/v1/bridge/openapi
GET /api/v1/swap/openapi
GET /api/v1/health
GET /api/v1/ready
GET /api/v1/version
```

The combined OpenAPI document contains every registered API route/action. Bridge and Swap contracts are generated domain subsets. Missing hand-authored runtime descriptions are filled from the generated route registry so a new handler cannot silently disappear from `/api/v1/openapi`.

## Authentication and errors

Contracts declare the `X-Api-Key` scheme. Runtime enforcement is configured through `POWERCHAIN_API_KEY_MODE=off|optional|required` and server-only `POWERCHAIN_API_KEYS`.

Generated OpenAPI documents also define a common error envelope with `error`, optional `code`, and optional `requestId`, plus standard `400`, `401`, `429`, and `500` response components.

## Generate and validate

```bash
pnpm api:generate
pnpm api:check
pnpm api:production:check
pnpm postman:generate
pnpm postman:check
```

`pnpm api:check` verifies the filesystem registry, combined and domain OpenAPI contracts, route contract, generated SDK registry and Postman artifacts.

## Safety

Never store private keys, seed phrases, wallet signing material, RPC/API credentials, service-role keys or runtime `.env` files under `api/`. The Postman dataset remains CSV-only and intentionally leaves credential fields blank.
