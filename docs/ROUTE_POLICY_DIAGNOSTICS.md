# Route Policy Diagnostics

PowerChain exposes a sanitized process-local request-policy snapshot at `GET /api/v1/system/route-policy`.

The endpoint exists for operational visibility only. It reports the number of registered critical routes, route counts by risk and rate class, and bounded in-process limiter occupancy. It never returns rate-limit bucket keys, pseudonymous client identifiers, IP addresses, wallet addresses, signatures, query strings, request bodies, or credentials.

`processLocal: true` and `authoritativeForAccounting: false` are part of the response contract. The counters must not be used for billing, settlement, balances, rewards, transaction finality, or cross-instance quotas.

Limiter pressure is derived from local bucket occupancy:

- `normal`: below 70%
- `elevated`: 70% to below 90%
- `high`: 90% or above

A high local pressure value is an operations signal. It does not by itself prove an attack or a distributed capacity problem.

The Runtime Status screen consumes this endpoint through a runtime-validated client and an abortable, visibility-aware hook. Provider readiness remains a separate fail-closed execution gate.
