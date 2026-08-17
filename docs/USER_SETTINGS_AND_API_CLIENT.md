# User settings, custom RPC/API and generated client

PowerChain DeFAI keeps user personalization separate from authentication and signing authority. The browser profile is a convenience profile only. Connected Solana/Sui wallets and explicit wallet signatures remain authoritative for wallet actions.

## What is saved

`apps/bridge/context/user-settings-context.tsx` owns one versioned settings object for:

- display name and preferred display currency;
- custom PowerChain API base URL;
- custom Solana wallet RPC URL;
- custom Sui wallet gRPC endpoint;
- Jupiter Swap API base URL selection;
- default swap network, slippage and advanced-routing preference;
- default Wormhole NTT bridge direction, polling interval and realtime preference.

Non-secret settings are stored in `localStorage` under `powerchain.user-settings.v2`. Earlier swap preferences are migrated into the v2 object on first load. Settings exports contain URLs/preferences only and explicitly exclude credentials.

## Secret boundary

PowerChain API keys and user-supplied Jupiter API keys are stored in `sessionStorage` under `powerchain.user-secrets.session.v1`. They are not written to `localStorage`, settings exports, source-controlled environment files, logs, operation journals or database records. Changing the corresponding PowerChain or Jupiter endpoint clears that session credential so a key cannot silently follow the user to a different host, including when a settings change arrives from another open tab; importing or resetting settings clears all session credentials.

Closing the browser session removes the session-only credential boundary according to browser session-storage behavior. Operators should still treat the browser as a credential-bearing client while a session key is active.

## Custom PowerChain API

When `Use custom PowerChain API` is enabled, browser `/api/v1/*` requests are resolved against the configured HTTPS base URL. If a session PowerChain key is present, the client sends it as `x-api-key`.

A remote PowerChain deployment must explicitly allow the application origin with `POWERCHAIN_CORS_ORIGINS`. Production CORS uses exact HTTPS origins; wildcard origins are intentionally unsupported.

Example:

```env
POWERCHAIN_CORS_ORIGINS=https://app.powerchain.example,https://ops.powerchain.example
```

## Custom wallet RPC

Custom RPC settings affect wallet-facing clients only:

- Solana: `ConnectionProvider` reconnects to the selected JSON-RPC endpoint.
- Sui: `SuiGrpcClient` is recreated with the selected gRPC endpoint, and the Settings endpoint test calls the Sui Core API `getChainIdentifier` through that same gRPC transport.

Server-side settlement validation, provider quorum, persisted evidence and bridge accounting do not become authoritative merely because the browser selects a custom RPC.

## Jupiter user credentials

Solana swap routes can use a user-supplied Jupiter API key. The browser forwards the session credential to the PowerChain Solana swap route using a dedicated internal header. The PowerChain server then calls Jupiter with `x-api-key`.

The default user API base is:

```text
https://api.jup.ag/swap/v2
```

A custom Jupiter host in production is rejected unless its hostname is explicitly listed in `POWERCHAIN_JUPITER_USER_API_HOSTS`. Localhost, private-style suffixes and IP-literal targets remain rejected even if an operator accidentally lists them, reducing server-side request-forgery risk. A custom host also requires a user-provided key; the server-managed Jupiter key is never forwarded to an arbitrary user host.

Example:

```env
POWERCHAIN_JUPITER_USER_API_HOSTS=swap-proxy.example.com
```

## Generated API registry and SDK client

Run:

```bash
pnpm api:registry:generate
pnpm api:registry:check
```

The generator scans `apps/bridge/app/api/v1/**/route.ts` and updates the application action registries plus `packages/sdk/src/generated/api-routes.ts`. This keeps the typed route catalog aligned with the actual Next.js route tree.

Settings can validate the selected Jupiter policy through `/api/v1/swap/solana/provider`; that check resolves the host/key policy and returns only sanitized provider metadata, without requesting a quote or transaction and without echoing the credential. The Swap OpenAPI contract also documents the optional per-request Jupiter key/base-URL headers. The SDK exposes both domain clients and the generated generic API client:

```ts
import { PowerChainClient, buildApiPath } from "@powerchain/sdk";

const client = new PowerChainClient({
  baseUrl: "https://api.powerchain.example",
  headers: () => ({ "x-api-key": process.env.POWERCHAIN_CLIENT_API_KEY! }),
});

const health = await client.api.get("/api/v1/health");
const transferPath = buildApiPath("/api/v1/bridge/transfers/:id", { id: transferId });
const transfer = await client.api.get(transferPath);
const bridge = await client.bridge.config();
```

A client may provide a user Jupiter credential explicitly for Solana swap routing:

```ts
await client.swap.solanaProviderWithJupiter({ apiKey: userJupiterApiKey, apiUrl: "https://api.jup.ag/swap/v2" });

await client.swap.solanaOrderWithJupiter(orderInput, {
  apiKey: userJupiterApiKey,
  apiUrl: "https://api.jup.ag/swap/v2",
});
```

Client-supplied credentials should come from an appropriate secret store for that client environment. Do not embed them in distributable browser bundles.

## Production checks

`pnpm user-settings:production:check` enforces the settings/profile surfaces, session-only secret boundary, custom endpoint routing, CORS controls, Jupiter host protections and generated SDK registry.
