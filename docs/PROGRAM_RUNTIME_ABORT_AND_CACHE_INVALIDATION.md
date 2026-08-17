# Program runtime abort and cache invalidation

PowerChain Protocol readiness uses bounded runtime verification. A verifier deadline is not only a response timeout: the deadline abort signal is propagated into Solana/Sui RPC work and into staking/escrow verification fetches where supported. This prevents timed-out readiness checks from continuing avoidable network work after the API has already returned.

The short process-local evidence cache is configuration-aware. Every program cache entry is tied to a non-exported SHA-256 fingerprint of the runtime identifiers that define that verifier target. When those identifiers change, the previous cache entry is discarded immediately. An in-flight result produced for an older fingerprint is also prevented from populating the cache after a configuration change.

The fingerprint is internal only. It is not returned by the API and is not deployment evidence. Program readiness still requires live RPC evidence, source identifiers are never promoted to deployment claims, and the Protocol surface remains read-only and non-custodial.
