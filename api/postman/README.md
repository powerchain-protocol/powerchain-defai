# PowerChain | DeFAI API Docs — Postman

PowerChain DeFAI ships a generated combined collection, local/production environments, and a generated API reference. The collection and API reference are generated from `shared/actions.json`; OpenAPI remains the richer schema contract.

Start with [`API_DOCS.md`](./API_DOCS.md) for production hosts, authentication, safety boundaries, contract imports, and the complete endpoint inventory.

## Specs, flows and mocks

Generated Postman lifecycle artifacts live alongside the collection:

- [`specs/`](./specs/README.md) — action/domain/auth/idempotency contract inventory.
- [`flows/`](./flows/README.md) — executable Collection Runner flows for preflight, Sui Swap, Solana Swap and Bridge monitoring.
- [`mocks/`](./mocks/README.md) — saved examples suitable for a Postman mock server.

All mock examples are explicitly non-authoritative and cannot prove wallet signing, execution, finality or Bridge settlement.

## Import

1. Import `PowerChain-DeFAI.postman_collection.json`.
2. Import either the local or production environment.
3. Set `apiKey` locally when the selected API environment requires `X-Api-Key`.

Production variables are:

| Variable | Value |
| --- | --- |
| `baseUrl` | `https://powerchain.app` |
| `swapUrl` | `https://swap.powerchain.app` |
| `bridgeUrl` | `https://bridge.powerchain.app` |
| `apiKey` | intentionally blank |

The combined collection routes shared APIs through `baseUrl`, Swap APIs through `swapUrl`, and Bridge APIs through `bridgeUrl`.

For local development, select the local environment and run `pnpm dev`.

You can also import `../swagger.yaml` or runtime `GET /api/v1/openapi` directly into Postman.

Regenerate and verify with:

```bash
pnpm postman:generate
pnpm postman:check
```

Do not put wallet secrets, treasury keys, provider credentials, or signing material in a shared Postman environment.
