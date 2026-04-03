CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  ip_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_ip_hash_created_at ON waitlist (ip_hash, created_at DESC);

INSERT INTO waitlist (email, ip_hash)
SELECT email, 'migrated:' || id::text
FROM subscribers
ON CONFLICT (email) DO NOTHING;
