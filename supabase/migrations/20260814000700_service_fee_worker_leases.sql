ALTER TABLE bridge_service_fee_settlements
  ADD COLUMN IF NOT EXISTS verification_lease_owner TEXT,
  ADD COLUMN IF NOT EXISTS verification_lease_until TIMESTAMPTZ(6);

CREATE INDEX IF NOT EXISTS bridge_service_fee_settlements_due_lease_idx
  ON bridge_service_fee_settlements(status, next_retry_at, verification_lease_until, created_at);
