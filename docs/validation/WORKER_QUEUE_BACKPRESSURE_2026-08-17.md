# Worker queue/backpressure validation — 2026-08-17

- Sequential workers claim one item at a time up to their configured processing budget.
- In-flight lease renewal survives process shutdown signals until the job exits.
- Queue backlog pressure is included in operations/system readiness.
- High backlog blocks async-settlement readiness without inventing settlement state.
- Environment templates expose bounded elevated/high backlog thresholds.
