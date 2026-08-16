-- Support bounded bridge metrics windows without full bridge_transfers scans.
CREATE INDEX "bridge_transfers_created_at_idx" ON "bridge_transfers"("created_at");
CREATE INDEX "bridge_transfers_direction_created_at_idx" ON "bridge_transfers"("direction", "created_at");
