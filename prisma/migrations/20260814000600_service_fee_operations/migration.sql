-- PowerChain Bridge 1.0.0 — service-fee operational hardening
ALTER TYPE "BridgeServiceFeeSettlementStatus" ADD VALUE IF NOT EXISTS 'RETRY_WAIT';
ALTER TYPE "BridgeServiceFeeSettlementStatus" ADD VALUE IF NOT EXISTS 'MANUAL_REVIEW';

ALTER TABLE bridge_service_fee_policies
  ADD COLUMN IF NOT EXISTS policy_commitment TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS bridge_service_fee_policies_policy_commitment_key
  ON bridge_service_fee_policies(policy_commitment)
  WHERE policy_commitment IS NOT NULL;

ALTER TABLE bridge_service_fee_settlements
  ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS collected_base_units NUMERIC(40,0),
  ADD COLUMN IF NOT EXISTS manual_review_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS manual_review_reason TEXT;

CREATE INDEX IF NOT EXISTS bridge_service_fee_settlements_retry_idx
  ON bridge_service_fee_settlements(status, next_retry_at, created_at);

CREATE INDEX IF NOT EXISTS bridge_service_fee_settlements_manual_review_idx
  ON bridge_service_fee_settlements(manual_review_at)
  WHERE status = 'MANUAL_REVIEW';
