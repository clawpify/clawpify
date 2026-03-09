-- organizations (mirrors Clerk orgs, lazy-synced on first use)
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT,
  slug TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Backfill organizations from existing stores
INSERT INTO organizations (id)
SELECT DISTINCT org_id FROM stores
ON CONFLICT (id) DO NOTHING;

-- Add FK from stores to organizations
ALTER TABLE stores
  DROP CONSTRAINT IF EXISTS fk_stores_org;
ALTER TABLE stores
  ADD CONSTRAINT fk_stores_org FOREIGN KEY (org_id) REFERENCES organizations(id);

-- Backfill null timestamps before adding NOT NULL
UPDATE stores SET created_at = COALESCE(created_at, NOW()) WHERE created_at IS NULL;
UPDATE audits SET started_at = COALESCE(started_at, NOW()) WHERE started_at IS NULL;
UPDATE audits SET created_at = COALESCE(created_at, NOW()) WHERE created_at IS NULL;
UPDATE audit_results SET created_at = COALESCE(created_at, NOW()) WHERE created_at IS NULL;

-- Add NOT NULL constraints
ALTER TABLE stores ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE audits ALTER COLUMN started_at SET NOT NULL;
ALTER TABLE audits ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE audit_results ALTER COLUMN created_at SET NOT NULL;
