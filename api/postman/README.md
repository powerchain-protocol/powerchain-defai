# PowerChain | DeFAI API Docs — Postman

PowerChain DeFAI ships generated domain- and method-oriented collections, local/production environments, data sources, saved response examples, and a generated API reference. Collections and API documentation are generated from `shared/actions.json`; OpenAPI remains the richer schema contract.

Start with [`API_DOCS.md`](./API_DOCS.md) for production hosts, authentication, safety boundaries, contract imports, and the complete endpoint inventory.

## Collections, datasets, specs, flows, and mocks

Generated Postman lifecycle artifacts live alongside the collection:

- [`PowerChain-DeFAI.postman_collection.json`](./PowerChain-DeFAI.postman_collection.json) — domain-oriented combined API collection.
- [`PowerChain-DeFAI.methods.postman_collection.json`](./PowerChain-DeFAI.methods.postman_collection.json) — canonical API requests grouped into `GET`, `POST`, and `PUT` folders with saved illustrative responses.
- [`datasets/`](./datasets/README.md) — CSV source for Postman datasets/data-driven runs.
- [`specs/`](./specs/README.md) — action/domain/auth/idempotency contract inventory.
- [`flows/`](./flows/README.md) — executable Collection Runner flows for preflight, Sui Swap, Solana Swap and Bridge monitoring.
- [`mocks/`](./mocks/README.md) — saved examples suitable for a Postman mock server.

All mock examples are explicitly non-authoritative and cannot prove wallet signing, execution, finality or Bridge settlement.

## Import

1. Import `PowerChain-DeFAI.postman_collection.json` and, when useful, the HTTP-method collection.
2. Import either the local or production environment.
3. Add `datasets/PowerChain-DeFAI.dataset.csv` when using Postman datasets or iteration data.
4. Set `apiKey` locally when the selected API environment requires `X-Api-Key`; never commit the credential into a collection or dataset.

Production variables are:

| Variable | Value |
| --- | --- |
| `baseUrl` | `https://powerchain.app` |
| `swapUrl` | `https://swap.powerchain.app` |
| `bridgeUrl` | `https://bridge.powerchain.app` |
| `apiKey` | intentionally blank |

The combined collection routes shared APIs through `baseUrl`, Swap APIs through `swapUrl`, and Bridge APIs through `bridgeUrl`.

For local development, select the local environment and run `pnpm dev`. Its `baseUrl`, `swapUrl`, and `bridgeUrl` values all resolve to `http://localhost:3000`, preventing accidental production routing during a local collection run.

Configured workspace specification: <https://crimson-crescent-8585.postman.co/workspace/55a50a8b-cdb7-46f5-807e-3494d0262565/specification/1afb4b8d-159d-4f42-8805-f1f1a5143539/file/04e6ee61-ea2e-4c44-83c6-51471951a035>.

You can also import `../swagger.yaml` or runtime `GET /api/v1/openapi` directly into Postman.

Regenerate and verify with:

```bash
pnpm postman:datasets:generate
pnpm postman:generate
pnpm postman:check
```

Do not put wallet secrets, treasury keys, provider credentials, or signing material in a shared Postman environment.
