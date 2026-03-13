CREATE TABLE IF NOT EXISTS waitlist_rate_limits (
  ip_hash TEXT PRIMARY KEY,
  first_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  usage_count INTEGER NOT NULL DEFAULT 0
);

-- Add unique constraint on email (for duplicate check)
ALTER TABLE waitlist ADD CONSTRAINT waitlist_email_unique UNIQUE (email);
