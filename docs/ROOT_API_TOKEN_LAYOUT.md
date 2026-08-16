# Root API and Token Layout

PowerChain DeFAI keeps executable application code and release/client contracts separate.

## API contracts

The root `api/` directory owns checked-in API tooling:

```text
api/
├── package.json
├── README.md
├── swagger.yaml
└── postman/
    ├── PowerChain-DeFAI.postman_collection.json
    ├── PowerChain-DeFAI.local.postman_environment.json
    └── README.md
```

Runtime handlers remain under `apps/bridge/app/api/v1`. `shared/actions.json` and `apps/bridge/config/api-routes.ts` remain generated route registries. Use `pnpm api:contracts:generate` after adding or removing API handlers and `pnpm api:contracts:check` in release validation.

The canonical runtime OpenAPI endpoint remains `/api/v1/openapi`. `/api`, `/api/openapi`, `/openapi`, and `/swagger` redirect to that endpoint; filesystem API-contract files are never served directly by Vercel.

## Token metadata

Token metadata is grouped with token trust material:

```text
tokens/
├── README.md
└── metadata/
    ├── README.md
    ├── providers.json
    ├── pwrc.json
    └── wpwrc.json
```

PWRC/wPWRC metadata remains bound to the token-information commitment and deterministic build manifest. Presentation metadata does not override the trusted token registry or runtime chain verification.

## Sui Bridge target

`config/sui-bridge.json` defines the source-level target contract without inventing deployment identifiers. `apps/backend/src/bridge/sui-targets.ts` validates and normalizes a configured package ID before composing Move entry-function targets. The Move source alias remains `0x0` until a verified package is published and synchronized through the governed deployment workflow.
