# Failure Safety

PowerChain Bridge treats transaction uncertainty and database contention as recovery events, not permission to duplicate mutations.

## Database contention

Critical bridge-transfer and claim state changes execute in PostgreSQL `SERIALIZABLE` transactions. Serialization/deadlock errors are retried a bounded number of times with exponential delay. Business errors are never retried by this helper.

## Bridge transfer idempotency

A quote can produce only one persisted transfer. Replaying the same idempotency key returns the same transfer. A different idempotency key attempting to consume an already-used quote fails with `QUOTE_ALREADY_USED`.

## Claim idempotency

Reservation and submission have independent idempotency keys. `claims.submit_idempotency_key` binds the first accepted submission key. A later different submit key fails closed instead of silently reusing the claim.

## Migration mirrors

Every Prisma migration must have a byte-identical Supabase migration mirror. `pnpm db:check:migrations` enforces this to prevent deployment paths from drifting.
