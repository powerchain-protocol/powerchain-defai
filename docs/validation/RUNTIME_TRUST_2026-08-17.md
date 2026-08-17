# Runtime Trust Validation — 2026-08-17

## Scope

This record covers the production trust boundary between Cloudflare/Vercel client-IP signals, durable API throttling, API-key enforcement, post-deploy smoke checks, and canonical route policy.

## Verified invariants

- Cloudflare deployment sets the non-secret `POWERCHAIN_RUNTIME_PLATFORM=cloudflare` runtime binding.
- `clientIpSecurityContext()` accepts `CF-Connecting-IP` only in explicit Cloudflare runtime mode and `x-vercel-forwarded-for` only when `VERCEL=1`.
- Generic `X-Forwarded-For` and `X-Real-IP` are not trusted by the canonical client-IP helper.
- Client addresses are transformed into pseudonymous rate-limit keys and are not wallet identity, bridge accounting, settlement, or finality evidence.
- The database-backed durable limiter consumes only the canonical pseudonymous client identity when no authenticated actor is available; it does not read raw forwarded IP headers directly.
- Production API-key validation requires at least one configured key between 24 and 256 characters and rejects duplicate valid keys.
- Post-deploy smoke checks support `POWERCHAIN_SMOKE_API_KEY`, never print the secret, and require HTTPS outside localhost.
- `/api/v1/version` participates in the canonical public-read/light route-policy registry.

## Validation result

The dedicated `runtime-trust:production:check` passes, and the broader source-level production-check inventory passes 90 of 90 runnable checks in the validation container. The Node-24 runtime gate and reviewed `pnpm-lock.yaml` gate remain environment/release prerequisites and were intentionally not bypassed.
