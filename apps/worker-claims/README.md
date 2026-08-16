# Claims Worker

Thin process supervisor for persisted claim payout, verification, retry, and recovery tasks.

Canonical claims logic lives in `@powerchain/backend/claims`. This workspace must not duplicate eligibility, payout, or persistence rules.
