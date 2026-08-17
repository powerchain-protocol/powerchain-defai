# Route policy enforcement

PowerChain keeps browser/API route identity in the canonical backend routing registry and applies a lightweight policy at the Next.js `proxy.ts` boundary for **registered critical routes**.

## What is enforced

For a registered critical route, the proxy:

- preserves or creates a bounded `x-request-id`;
- attaches static route ID, risk class and rate class metadata;
- checks feature availability for Swap and Bridge execution routes;
- applies a bounded process-local rate-limit prefilter;
- returns `405 Method Not Allowed` with `Allow` when the path is registered but the HTTP method is not;
- forwards rate-limit metadata without including wallet addresses, signatures, query strings, bodies or route parameter values.

Route handlers that use `enforceCoreRoute()` detect the proxy marker and do not consume the same local rate bucket twice. Direct route invocation in tests or development still evaluates the same policy fail-closed.

## Bounded memory

The process-local limiter has a fixed default capacity of 10,000 buckets, configurable with `POWERCHAIN_RATE_LIMIT_MAX_BUCKETS` inside a bounded 1,000–100,000 range. Expired buckets are pruned periodically and overflow evicts the least-recently-touched entries.

This limiter is a **best-effort instance-local protection**, not a distributed quota, billing meter, settlement signal or abuse-accounting system. Production infrastructure should provide a shared gateway/WAF/rate-limit service when enforcement must span multiple Vercel/server instances.

## Next.js proxy boundary

Next.js 16 Proxy runs on the Node.js runtime and executes before filesystem/application routes. PowerChain therefore uses it for cheap request metadata, compatibility-safe critical-route policy and early responses only. Slow provider calls, wallet authorization, settlement checks and transaction execution remain in route/server services.

## Unknown generated API routes

The critical routing registry is intentionally a reviewed subset of the generated API surface. A generated API route that has not yet been classified is **not blocked** by the proxy; it simply does not receive critical-route metadata or the local critical-route rate prefilter. API-key policy remains independent.
