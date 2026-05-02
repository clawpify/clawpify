CREATE TABLE IF NOT EXISTS ebay_policy_defaults (
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  marketplace_id TEXT NOT NULL DEFAULT 'EBAY_US',
  fulfillment_policy_id TEXT NOT NULL,
  payment_policy_id TEXT NOT NULL,
  return_policy_id TEXT NOT NULL,
  merchant_location_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (org_id, marketplace_id)
);