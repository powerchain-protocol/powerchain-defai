-- PowerChain Bridge 1.0.0 — canonical production core schema
DO $$ BEGIN CREATE TYPE "BridgeDirection" AS ENUM ('SOLANA_TO_SUI','SUI_TO_SOLANA'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "BridgeTransferStatus" AS ENUM ('CREATED','SOURCE_SUBMITTING','SOURCE_SUBMITTED','SOURCE_FINALIZED','MESSAGE_OBSERVED','DESTINATION_SUBMITTED','DESTINATION_FINALIZED','RECONCILIATION_REQUIRED','COMPLETED','FAILED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "BridgeGovernanceProposalKind" AS ENUM ('ROUTE_RUNTIME_UPDATE','TRUSTED_WALLET_UPDATE','CLAIM_ALLOCATION_UPDATE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "BridgeGovernanceProposalStatus" AS ENUM ('PENDING','APPLIED','REJECTED','EXPIRED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ClaimStatus" AS ENUM ('RESERVED','SUBMITTING','SUBMITTED','FINALIZED','FAILED','EXPIRED','UNKNOWN'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS bridge_quotes (
  id TEXT PRIMARY KEY,
  route_id TEXT NOT NULL,
  direction "BridgeDirection" NOT NULL,
  amount_base_units NUMERIC(40,0) NOT NULL CHECK (amount_base_units > 0),
  fee_base_units NUMERIC(40,0) NOT NULL DEFAULT 0 CHECK (fee_base_units >= 0),
  source_address TEXT NOT NULL,
  destination_address TEXT NOT NULL,
  runtime_snapshot_id TEXT NOT NULL,
  intent_commitment TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ(6) NOT NULL,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bridge_quotes_route_idx ON bridge_quotes(route_id,direction,created_at DESC);
CREATE INDEX IF NOT EXISTS bridge_quotes_expiry_idx ON bridge_quotes(expires_at);

CREATE TABLE IF NOT EXISTS bridge_transfers (
  id TEXT PRIMARY KEY,
  quote_id TEXT NOT NULL UNIQUE REFERENCES bridge_quotes(id) ON DELETE RESTRICT,
  route_id TEXT NOT NULL,
  direction "BridgeDirection" NOT NULL,
  principal_base_units NUMERIC(40,0) NOT NULL CHECK (principal_base_units > 0),
  source_address TEXT NOT NULL,
  destination_address TEXT NOT NULL,
  runtime_snapshot_id TEXT NOT NULL,
  intent_commitment TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  status "BridgeTransferStatus" NOT NULL DEFAULT 'CREATED',
  source_tx TEXT,
  destination_tx TEXT,
  source_finality_ref TEXT,
  destination_finality_ref TEXT,
  failure_code TEXT,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bridge_transfers_status_idx ON bridge_transfers(status,updated_at DESC);
CREATE INDEX IF NOT EXISTS bridge_transfers_source_idx ON bridge_transfers(source_address,created_at DESC);
CREATE INDEX IF NOT EXISTS bridge_transfers_destination_idx ON bridge_transfers(destination_address,created_at DESC);
CREATE INDEX IF NOT EXISTS bridge_transfers_source_tx_idx ON bridge_transfers(source_tx) WHERE source_tx IS NOT NULL;
CREATE INDEX IF NOT EXISTS bridge_transfers_destination_tx_idx ON bridge_transfers(destination_tx) WHERE destination_tx IS NOT NULL;

CREATE TABLE IF NOT EXISTS bridge_governance_proposals (
  id TEXT PRIMARY KEY,
  kind "BridgeGovernanceProposalKind" NOT NULL,
  status "BridgeGovernanceProposalStatus" NOT NULL DEFAULT 'PENDING',
  payload JSONB NOT NULL,
  payload_hash TEXT NOT NULL,
  idempotency_key TEXT UNIQUE,
  proposed_by TEXT NOT NULL,
  approved_by TEXT,
  request_id TEXT NOT NULL,
  expires_at TIMESTAMPTZ(6) NOT NULL,
  applied_at TIMESTAMPTZ(6),
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bridge_governance_proposals_state_idx ON bridge_governance_proposals(kind,status,created_at DESC);

CREATE TABLE IF NOT EXISTS bridge_audit_events (
  id TEXT PRIMARY KEY,
  event TEXT NOT NULL,
  actor TEXT NOT NULL,
  target TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bridge_audit_events_event_idx ON bridge_audit_events(event,created_at DESC);
CREATE INDEX IF NOT EXISTS bridge_audit_events_target_idx ON bridge_audit_events(target,created_at DESC);

CREATE TABLE IF NOT EXISTS claim_allocations (
  wallet TEXT PRIMARY KEY,
  amount_base_units NUMERIC(40,0) NOT NULL CHECK (amount_base_units > 0),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  reserved_by_claim_id TEXT,
  reserved_until TIMESTAMPTZ(6),
  claimed_at TIMESTAMPTZ(6),
  note TEXT,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS claim_challenges (
  id TEXT PRIMARY KEY,
  wallet TEXT NOT NULL,
  message TEXT NOT NULL,
  nonce_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ(6) NOT NULL,
  consumed_at TIMESTAMPTZ(6),
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS claim_challenges_wallet_idx ON claim_challenges(wallet,expires_at DESC);

CREATE TABLE IF NOT EXISTS claims (
  id TEXT PRIMARY KEY,
  wallet TEXT NOT NULL,
  allocation_base_units NUMERIC(40,0) NOT NULL CHECK (allocation_base_units > 0),
  amount_base_units NUMERIC(40,0) NOT NULL CHECK (amount_base_units > 0),
  status "ClaimStatus" NOT NULL DEFAULT 'RESERVED',
  idempotency_key TEXT NOT NULL UNIQUE,
  reservation_expires_at TIMESTAMPTZ(6) NOT NULL,
  source_tx TEXT,
  failure_code TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMPTZ(6),
  worker_lease_owner TEXT,
  worker_lease_until TIMESTAMPTZ(6),
  finalized_at TIMESTAMPTZ(6),
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS claims_wallet_state_idx ON claims(wallet,status);
CREATE INDEX IF NOT EXISTS claims_retry_idx ON claims(status,next_retry_at);
CREATE INDEX IF NOT EXISTS claims_reservation_idx ON claims(status,reservation_expires_at);

CREATE TABLE IF NOT EXISTS worker_heartbeats (
  worker_id TEXT PRIMARY KEY,
  worker_type TEXT NOT NULL,
  version TEXT NOT NULL,
  started_at TIMESTAMPTZ(6) NOT NULL,
  heartbeat_at TIMESTAMPTZ(6) NOT NULL
);
CREATE INDEX IF NOT EXISTS worker_heartbeats_type_idx ON worker_heartbeats(worker_type,heartbeat_at DESC);

ALTER TABLE bridge_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bridge_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bridge_governance_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE bridge_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_heartbeats ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE bridge_quotes,bridge_transfers,bridge_governance_proposals,bridge_audit_events,claim_allocations,claim_challenges,claims,worker_heartbeats FROM anon, authenticated;
