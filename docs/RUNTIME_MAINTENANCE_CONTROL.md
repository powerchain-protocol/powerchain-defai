# Runtime Maintenance Control

PowerChain supports a persisted maintenance state so workers can be drained without restarting them.

## Safety model

- The singleton state is stored in `runtime_maintenance_state`.
- Updates require the authenticated operator bearer token and an `expectedRevision`.
- Revision mismatch returns a conflict instead of overwriting another operator's decision.
- Every accepted state change writes a bridge audit event with actor, request ID, reason, previous state, and next revision.
- Workers refresh the persisted state during their normal loop and stop claiming new jobs when draining is enabled.
- In-flight jobs continue under their existing renewable leases.
- If the maintenance-state read fails, workers fail closed and do not claim new work.
- `POWERCHAIN_WORKER_DRAIN_MODE=true` remains an emergency one-way override. It can force drain but cannot be disabled through the API.

## Operator CLI

```bash
POWERCHAIN_DEPLOY_BASE_URL=https://app.example \
POWERCHAIN_OPERATOR_API_TOKEN='...' \
pnpm operator:maintenance -- get

pnpm operator:maintenance -- drain 'production deploy'
pnpm deploy:drain:wait
# deploy / migrate / smoke
pnpm operator:maintenance -- resume 'deploy complete'
pnpm deploy:resume:check
```

The CLI first reads the current revision, then uses compare-and-swap semantics for the mutation. It never signs or submits blockchain transactions.
