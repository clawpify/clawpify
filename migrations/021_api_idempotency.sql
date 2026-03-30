-- Idempotency cache for critical POST endpoints (contracts, payouts).
CREATE TABLE api_idempotency (
  org_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  operation TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  response_status SMALLINT NOT NULL,
  response_body JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, idempotency_key, operation)
);

CREATE INDEX api_idempotency_created_at ON api_idempotency (created_at);
