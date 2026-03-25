-- Verified phone numbers for Twilio/SMS intake (Clerk user + org).
CREATE TABLE IF NOT EXISTS intake_phone_bindings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_e164 TEXT NOT NULL,
  clerk_user_id TEXT NOT NULL,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_intake_phone_e164 UNIQUE (phone_e164),
  CONSTRAINT uq_intake_phone_org_user UNIQUE (org_id, clerk_user_id)
);

CREATE INDEX IF NOT EXISTS idx_intake_phone_bindings_org ON intake_phone_bindings(org_id);
