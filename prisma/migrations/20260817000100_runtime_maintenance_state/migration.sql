CREATE TABLE IF NOT EXISTS runtime_maintenance_state (
  id TEXT PRIMARY KEY,
  draining BOOLEAN NOT NULL DEFAULT FALSE,
  revision INTEGER NOT NULL DEFAULT 0,
  reason TEXT,
  updated_by TEXT NOT NULL,
  request_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE runtime_maintenance_state ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE runtime_maintenance_state FROM anon, authenticated;
