CREATE TABLE IF NOT EXISTS api_rate_limit_windows (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE api_rate_limit_windows ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE api_rate_limit_windows FROM anon, authenticated;
