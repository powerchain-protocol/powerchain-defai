# Operator maintenance workflow

PowerChain maintenance uses worker drain mode as a **claim gate**, not a transaction replay mechanism. Operators enable `POWERCHAIN_WORKER_DRAIN_MODE=true` in the deployment environment, wait until the runtime proves quiescence, deploy, run smoke checks, disable drain mode, and verify that execution capabilities recovered.

## Wait for quiescence

After enabling drain mode on the running deployment:

```bash
POWERCHAIN_DEPLOY_BASE_URL=https://app.example.com \
  pnpm deploy:drain:wait
```

`deploy:drain:wait` polls `/api/v1/system/readiness` and succeeds only when all of the following are simultaneously true:

- drain mode is still enabled;
- database readiness is available so active leases can be measured;
- `maintenance.activeLeases === 0`;
- `maintenance.quiescent === true`.

If drain mode was never enabled, is disabled before quiescence, the database cannot provide lease evidence, or the timeout expires, the command fails closed.

Optional controls:

```env
POWERCHAIN_DRAIN_WAIT_TIMEOUT_MS=600000
POWERCHAIN_DRAIN_WAIT_INTERVAL_MS=5000
POWERCHAIN_SMOKE_TIMEOUT_MS=10000
```

Quiescence is a process/queue ownership signal. It is not blockchain finality and must not be used to infer bridge, staking, claim, fee, or escrow settlement.

## Inspect operator attention

The operator attention API is bearer-authenticated and read-only. The CLI keeps `POWERCHAIN_OPERATOR_API_TOKEN` out of browser bundles:

```bash
POWERCHAIN_DEPLOY_BASE_URL=https://app.example.com \
POWERCHAIN_OPERATOR_API_TOKEN='...' \
  pnpm operator:attention -- --limit=50 --queue=bridge
```

Optional `--queue=bridge|claims|fees` and `--before=<ISO-8601>` parameters provide bounded filtering/pagination. The response contains only queue, operation ID, status, failure code, attempt count, update time, queue summary counts, and a next-page timestamp. It does not expose wallets, source/destination addresses, transaction payloads, provider credentials, reconciliation evidence, signing material, or lease-owner IDs.

The attention view never retries, signs, submits, clears, or mutates an operation.

## Resume verification

After deployment and after drain mode has been disabled:

```bash
POWERCHAIN_DEPLOY_BASE_URL=https://app.example.com \
  pnpm deploy:resume:check
```

The check requires:

- drain mode is off;
- database, providers, and required workers are ready;
- `capabilities.newOperations === true`;
- `capabilities.asyncSettlement === true`.

Run the existing `pnpm deploy:smoke` as the broader post-deploy check. A successful resume check is not transaction finality and does not replace live wallet/RPC/Anchor exercises required before production promotion.
