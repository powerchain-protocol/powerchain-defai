# PowerChain | DeFAI Postman Specs

Generated API-spec inventory for Postman tooling. The canonical schema contracts remain `api/swagger.yaml`, `api/bridge/openapi.yaml`, and `api/swap/openapi.yaml`.

- `PowerChain-DeFAI.postman_specs.json` binds all generated actions to their domain, method, path, authentication mode and idempotency.
- API-key authentication uses `X-Api-Key`.
- Bridge, Swap and shared API hosts stay separated.
- Wallet secrets and signing material must never be stored in Postman variables.

Regenerate with `pnpm postman:generate` and verify with `pnpm postman:check`.
