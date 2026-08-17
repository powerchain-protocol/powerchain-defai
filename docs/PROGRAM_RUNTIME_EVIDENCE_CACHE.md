# Program runtime evidence cache

PowerChain program readiness uses a short-lived, server-side evidence cache to avoid duplicate Solana/Sui verification fan-out when multiple runtime-status consumers refresh together. The cache does not turn source configuration into deployment evidence and is never authoritative for settlement.

`POWERCHAIN_PROGRAM_EVIDENCE_CACHE_TTL_MS` controls the cache lifetime. The default is 15000 ms and the accepted range is 1000–60000 ms. Cached responses preserve the original `checkedAt` timestamp and expose `evidenceMode: "cache"` plus `cacheAgeMs`; live verification exposes `evidenceMode: "live"` and `cacheAgeMs: 0`.

Concurrent verification for the same program is coalesced through one in-flight promise. Manual Protocol UI verification uses `?force=1` to bypass completed cache entries while still coalescing an already-running verifier. Automatic/background refreshes remain cache-eligible. API responses keep `Cache-Control: no-store`, so this process-local evidence cache is not an HTTP/CDN cache.

Freshness remains a separate client concern. Cached evidence still ages from its original chain-verification timestamp and becomes stale in the Protocol UI when it crosses the existing freshness window.
