-- PowerChain Bridge 1.0.0 — governed service-fee control plane and settlement ledger

DO $$ BEGIN
  CREATE TYPE "BridgeServiceFeeChain" AS ENUM ('SOLANA', 'SUI');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "BridgeServiceFeeSettlementStatus" AS ENUM ('ASSESSED', 'SUBMITTED', 'VERIFIED', 'FAILED', 'WAIVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE "BridgeGovernanceProposalKind" ADD VALUE IF NOT EXISTS 'SERVICE_FEE_POLICY_UPDATE';
EXCEPTION WHEN undefined_object THEN NULL; END $$;

ALTER TABLE bridge_quotes
  ADD COLUMN IF NOT EXISTS service_fee_recipient TEXT;

CREATE TABLE IF NOT EXISTS bridge_service_fee_policies (
  id TEXT PRIMARY KEY,
  route_id TEXT NOT NULL,
  source_chain "BridgeServiceFeeChain" NOT NULL,
  asset_id TEXT NOT NULL,
  fee_bps INTEGER NOT NULL CHECK (fee_bps >= 0 AND fee_bps <= 1000),
  recipient TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  version INTEGER NOT NULL CHECK (version > 0),
  min_fee_base_units NUMERIC(40,0),
  max_fee_base_units NUMERIC(40,0),
  effective_from TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  disabled_at TIMESTAMPTZ(6),
  created_by TEXT NOT NULL,
  proposal_id TEXT,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT bridge_service_fee_policy_min_nonnegative CHECK (min_fee_base_units IS NULL OR min_fee_base_units >= 0),
  CONSTRAINT bridge_service_fee_policy_max_nonnegative CHECK (max_fee_base_units IS NULL OR max_fee_base_units >= 0),
  CONSTRAINT bridge_service_fee_policy_bounds CHECK (min_fee_base_units IS NULL OR max_fee_base_units IS NULL OR min_fee_base_units <= max_fee_base_units),
  CONSTRAINT bridge_service_fee_policy_route_version_unique UNIQUE (route_id, source_chain, version),
  CONSTRAINT bridge_service_fee_policy_proposal_fk FOREIGN KEY (proposal_id) REFERENCES bridge_governance_proposals(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS bridge_service_fee_policy_active_idx
  ON bridge_service_fee_policies(route_id, source_chain, enabled, version DESC);

CREATE TABLE IF NOT EXISTS bridge_service_fee_settlements (
  id TEXT PRIMARY KEY,
  transfer_id TEXT NOT NULL UNIQUE,
  quote_id TEXT NOT NULL,
  route_id TEXT NOT NULL,
  source_chain "BridgeServiceFeeChain" NOT NULL,
  asset_id TEXT NOT NULL,
  principal_base_units NUMERIC(40,0) NOT NULL CHECK (principal_base_units >= 0),
  fee_bps INTEGER NOT NULL CHECK (fee_bps >= 0 AND fee_bps <= 1000),
  fee_base_units NUMERIC(40,0) NOT NULL CHECK (fee_base_units >= 0),
  recipient TEXT NOT NULL,
  policy_id TEXT NOT NULL,
  policy_version INTEGER NOT NULL,
  commitment TEXT NOT NULL UNIQUE,
  source_tx TEXT,
  status "BridgeServiceFeeSettlementStatus" NOT NULL DEFAULT 'ASSESSED',
  verified_at TIMESTAMPTZ(6),
  verification_evidence JSONB,
  failure_code TEXT,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT bridge_service_fee_settlement_transfer_fk FOREIGN KEY (transfer_id) REFERENCES bridge_transfers(id) ON DELETE RESTRICT,
  CONSTRAINT bridge_service_fee_settlement_quote_fk FOREIGN KEY (quote_id) REFERENCES bridge_quotes(id) ON DELETE RESTRICT,
  CONSTRAINT bridge_service_fee_settlement_policy_fk FOREIGN KEY (policy_id) REFERENCES bridge_service_fee_policies(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS bridge_service_fee_settlement_status_idx
  ON bridge_service_fee_settlements(status, created_at);
CREATE INDEX IF NOT EXISTS bridge_service_fee_settlement_route_idx
  ON bridge_service_fee_settlements(route_id, source_chain, created_at);
CREATE INDEX IF NOT EXISTS bridge_service_fee_settlement_tx_idx
  ON bridge_service_fee_settlements(source_tx) WHERE source_tx IS NOT NULL;

ALTER TABLE bridge_service_fee_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE bridge_service_fee_settlements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE bridge_service_fee_policies FROM anon, authenticated;
REVOKE ALL ON TABLE bridge_service_fee_settlements FROM anon, authenticated;
