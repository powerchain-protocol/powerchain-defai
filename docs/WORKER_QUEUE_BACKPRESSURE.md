# Worker queue backpressure and shutdown ownership

PowerChain workers claim work **just in time**. The configured batch size is a processing budget, not a prefetch lease count. Each bridge, claim, or fee job is claimed with `limit: 1`, processed under renewable ownership, and only then may the worker claim the next item.

During `SIGINT`/`SIGTERM`, new work stops immediately. Lease renewal for the currently in-flight job continues until that job actually exits, avoiding an ownership gap during graceful drain. Lease renewal never authorizes transaction replay or automatic resubmission; ambiguous chain state still goes through idempotency/reconciliation.

Operational readiness classifies queue backlog as `normal`, `elevated`, or `high`. Defaults are controlled by `POWERCHAIN_QUEUE_BACKLOG_ELEVATED=500` and `POWERCHAIN_QUEUE_BACKLOG_HIGH=2000`. Elevated backlog degrades readiness. High backlog disables the `asyncSettlement` capability until pressure falls, while read-only provider capability remains independent.

Queue pressure is operational capacity evidence, not accounting or settlement authority.
