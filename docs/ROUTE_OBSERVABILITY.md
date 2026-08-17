# Route observability

PowerChain uses the backend critical-route registry as the source of static API route labels.

For registered critical routes, the Next.js proxy adds:

- `x-request-id`
- `x-powerchain-route-id`
- `x-powerchain-route-risk`
- `x-powerchain-rate-class`
- a `Server-Timing` route label

These labels contain only static registry metadata. Dynamic route parameters, wallet addresses, transaction signatures, query values, request bodies, credentials, and API keys are never copied into route labels.

The critical registry is intentionally smaller than the generated API surface. A route not present in the critical registry is **not blocked** by the observability layer; it simply receives no PowerChain route label. Generated route and OpenAPI validation remain separate release gates.

## Dynamic route matching

`matchCoreRoute()` returns dynamic parameters separately from the static route definition. Trusted server code may consume those values, but logs and telemetry should use the static route `id` rather than parameter values to prevent high-cardinality or sensitive telemetry.

`allowedMethodsForCorePath()` distinguishes a method mismatch on a registered path from a completely unregistered path. This is available to backend adapters that need standards-compliant `405 Method Not Allowed` handling.

## Recovery navigation

Error and recovery surfaces should use `RecoveryActions` and `APP_ROUTES` instead of hard-coded links. This keeps operational recovery links synchronized with the canonical application route registry.
