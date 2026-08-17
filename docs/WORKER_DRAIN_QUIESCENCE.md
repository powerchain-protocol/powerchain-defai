# Worker drain quiescence and operator attention

Drain mode stops workers from claiming new jobs while allowing in-flight leased work to finish. Operations readiness now reports the number of active queue leases and `maintenance.quiescent`. A draining runtime is quiescent only when the database is available and no Bridge, Claims, or Fees queue item has an unexpired owned lease.

`GET /api/v1/operator/operations/attention` is an authenticated, read-only operator view for items already requiring manual attention. It returns queue, operation id, status, failure code, attempt count, and update time only. It deliberately excludes wallet addresses, source/destination addresses, transaction payloads, provider credentials, lease-owner identifiers, and reconciliation evidence.

Quiescence is an operational shutdown signal, not blockchain finality. Operators must still use transaction reconciliation/finality evidence before changing operation state. The attention endpoint never retries, signs, submits, or mutates an operation.
