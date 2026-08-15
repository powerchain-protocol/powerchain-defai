-- Real Wormhole NTT bridge execution / verification state.
ALTER TABLE "bridge_transfers"
  ADD COLUMN "wormhole_operation_id" TEXT,
  ADD COLUMN "wormhole_emitter_chain" INTEGER,
  ADD COLUMN "wormhole_emitter" TEXT,
  ADD COLUMN "wormhole_sequence" TEXT,
  ADD COLUMN "wormhole_vaa_hash" TEXT,
  ADD COLUMN "source_verified_at" TIMESTAMPTZ(6),
  ADD COLUMN "message_observed_at" TIMESTAMPTZ(6),
  ADD COLUMN "destination_verified_at" TIMESTAMPTZ(6),
  ADD COLUMN "reconciliation_evidence" JSONB,
  ADD COLUMN "bridge_worker_lease_owner" TEXT,
  ADD COLUMN "bridge_worker_lease_until" TIMESTAMPTZ(6),
  ADD COLUMN "bridge_attempt_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "bridge_next_retry_at" TIMESTAMPTZ(6);

CREATE UNIQUE INDEX "bridge_transfers_source_tx_key" ON "bridge_transfers"("source_tx");
CREATE UNIQUE INDEX "bridge_transfers_wormhole_operation_id_key" ON "bridge_transfers"("wormhole_operation_id");
CREATE INDEX "bridge_transfers_status_bridge_next_retry_at_idx" ON "bridge_transfers"("status", "bridge_next_retry_at");
CREATE INDEX "bridge_transfers_bridge_worker_lease_until_idx" ON "bridge_transfers"("bridge_worker_lease_until");
