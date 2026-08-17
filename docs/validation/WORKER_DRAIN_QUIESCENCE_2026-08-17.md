# Worker drain quiescence validation — 2026-08-17

- Active owned leases are counted across Bridge, Claims, and Fees queues.
- Drain mode exposes `quiescent=true` only after active queue leases reach zero.
- Operator attention is authenticated and read-only.
- Operator attention payload excludes wallet/address/payload/reconciliation evidence and lease-owner data.
- Manual attention does not grant transaction replay authority.
