# Runtime maintenance validation — 2026-08-17

This pass adds persisted, audited, compare-and-swap drain/resume control. Workers consume the state dynamically and fail closed if the maintenance state cannot be read. The environment drain flag remains a one-way emergency override.

Validated by `pnpm runtime-maintenance:production:check` plus the normal production gate suite.
