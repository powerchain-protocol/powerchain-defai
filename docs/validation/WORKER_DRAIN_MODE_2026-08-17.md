# Worker drain mode validation — 2026-08-17

- Workers retain heartbeats while drain mode is enabled.
- Bridge, Claims, and Fees workers do not claim new work in drain mode.
- Aggregate readiness disables new operations and async settlement while draining.
- Read capability remains independent of worker drain state.
- Drain mode does not grant replay, signing, retry, or cancellation authority.
