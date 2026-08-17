# Route policy enforcement validation — 2026-08-17

This pass centralized lightweight critical-route feature/rate policy at the Next.js proxy boundary without making the reviewed critical-route registry a hard allowlist for the full generated API.

Validated source invariants:

- registered route method mismatches return `405` with `Allow`;
- request IDs are retained on proxy-generated failures;
- route handlers do not double-consume rate buckets after proxy enforcement;
- direct route-handler invocation still evaluates policy;
- Swap/Bridge feature gates remain fail-closed;
- process-local rate buckets are capacity-bounded and pruned;
- dynamic params, wallet addresses, signatures and request payloads are not emitted as route labels;
- unknown generated API routes remain compatibility-safe.

The process-local limiter is deliberately documented as a best-effort instance prefilter. Distributed rate enforcement must be provided by deployment infrastructure when quotas must span multiple instances.
