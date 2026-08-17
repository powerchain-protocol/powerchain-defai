# Worker retry/dead-letter validation — 2026-08-17

- Bridge `RECONCILIATION_REQUIRED` removed from automatic worker claims.
- Bridge retry budget added with default maximum of 25 attempts.
- Permanent/invariant bridge failures escalate to manual reconciliation.
- Retry exhaustion clears leases and future retry timestamps.
- Queue pressure now incorporates oldest-pending age as well as count.
- High queue pressure continues to fail-close asynchronous settlement readiness.
- No automatic blockchain replay/resubmission path was introduced.
