# Cloudflare Workers deployment

PowerChain DeFAI supports Cloudflare Workers as an **additional** production target for the full-stack Next.js application. The existing standalone Node target remains available.

## Architecture

- Next.js App Router application: `apps/bridge`
- Adapter: `@opennextjs/cloudflare`
- Runtime: Cloudflare Workers / `workerd`
- Wrangler configuration: `apps/bridge/wrangler.jsonc`
- OpenNext configuration: `apps/bridge/open-next.config.ts`
- Static cache headers: `apps/bridge/public/_headers`
- Secrets: Cloudflare Worker secrets / deployment secret manager only

Cloudflare is not a signing or custody boundary. Wallet signatures remain client-authorized and backend secrets remain server-side.

## Local production preview

```bash
pnpm install --frozen-lockfile
pnpm cloudflare:preview
```

The preview command builds through OpenNext and executes on the Workers runtime rather than relying only on `next dev`.

## Deploy

Authenticate Wrangler using a scoped Cloudflare API token or Workers Builds, then configure the required environment variables and secrets in Cloudflare.

```bash
pnpm deploy:preflight
pnpm cloudflare:deploy
```

To upload a version without immediately changing traffic:

```bash
pnpm cloudflare:upload
```

## Environment and secrets

Use Wrangler/Cloudflare secret storage for values such as database credentials, private RPC URLs, API keys, signing-service credentials, and provider secrets. Do not place them in `NEXT_PUBLIC_*` variables.

Public build-time flags such as `NEXT_PUBLIC_CLOUDFLARE_ENABLED=true` may be configured in Workers Builds when the UI should expose Cloudflare as an active runtime provider.

## Optional production additions

Provision these only when required by the deployment; do not add placeholder bindings:

- R2 incremental cache for Next.js caching/ISR
- Cloudflare Images binding for Next.js image optimization
- WAF and rate-limiting rules for public API surfaces
- Turnstile for abuse-sensitive public forms/actions
- Custom domain and DNS

Every new binding should be added to `wrangler.jsonc`, documented, and covered by `cloudflare:production:check` before release.

## Trusted client IP boundary

The Worker config sets `POWERCHAIN_RUNTIME_PLATFORM=cloudflare` as a non-secret runtime variable. Only in that explicit runtime mode may backend security consume Cloudflare's `CF-Connecting-IP` signal, and it is immediately transformed into a pseudonymous rate-limit key. Generic `X-Forwarded-For` and `X-Real-IP` remain untrusted. Cloudflare documents `CF-Connecting-IP` as its canonical visitor-IP header for requests traversing the edge.

Do not use client-IP data as wallet identity, authorization, settlement, bridge-finality, or accounting evidence.
