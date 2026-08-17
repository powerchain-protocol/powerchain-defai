# Worker drain mode

PowerChain supports an explicit maintenance drain mode for controlled deployments and operator maintenance windows.

```env
POWERCHAIN_WORKER_DRAIN_MODE=true
```

When enabled, Bridge, Claims, and Fees workers continue their persisted heartbeats but do not claim new queue items. Any job already in flight before the process enters shutdown continues under its renewable lease until that operation exits.

Aggregate system readiness reports `checks.maintenance.draining=true`, disables `capabilities.newOperations`, and therefore disables `capabilities.asyncSettlement`. Provider-backed read capability remains independent.

Drain mode does not cancel, retry, replay, sign, or submit blockchain transactions. Ambiguous submissions remain under the existing persisted reconciliation and idempotency flows.

## Production deployment sequence

1. Enable drain mode for worker processes.
2. Wait until active work has completed and queue/worker status is understood.
3. Deploy the new application/workers.
4. Run the production smoke/readiness checks.
5. Disable drain mode and verify async-settlement readiness returns.

The environment flag is intentionally explicit. It is not an emergency transaction-cancellation switch and it does not modify persisted operation state.
