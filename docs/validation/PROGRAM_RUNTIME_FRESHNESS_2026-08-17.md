# Program runtime freshness validation — 2026-08-17

Validated production-source invariants:

- per-program runtime verification has a bounded deadline;
- timeout degrades only the affected program;
- timeout state is explicit in the typed API contract and runtime validator;
- client evidence ages to stale instead of remaining silently current;
- core bridge freshness is surfaced separately from server verification state;
- environment templates expose the bounded verifier timeout;
- no timeout/freshness path grants signing, replay, custody, or settlement authority.
