-- Idempotent processing of Twilio inbound webhooks (MessageSid deduplication).
CREATE TABLE IF NOT EXISTS twilio_inbound_message_ids (
  message_sid TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_twilio_inbound_message_org ON twilio_inbound_message_ids(org_id);
