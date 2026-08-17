# Operator maintenance validation — 2026-08-17

Validated source invariants:

- operator attention API remains bearer-authenticated and strict-rate-limited;
- attention supports bounded `limit`, queue filtering, and ISO timestamp pagination;
- response remains sanitized and read-only;
- blocked system-readiness fallback includes the strict maintenance shape and never claims quiescence;
- drain waiting requires drain mode, database evidence, zero active leases, and quiescence;
- resume verification requires drain mode off plus database/provider/worker readiness and both write capabilities;
- no maintenance helper signs, submits, retries, or mutates blockchain operations.
