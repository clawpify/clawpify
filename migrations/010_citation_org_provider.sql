-- Link citations to organizations (nullable for backward compat with anonymous audits)
ALTER TABLE chatgpt_citations ADD COLUMN IF NOT EXISTS org_id TEXT;
CREATE INDEX IF NOT EXISTS idx_chatgpt_citations_org ON chatgpt_citations(org_id) WHERE org_id IS NOT NULL;

-- Track which AI provider produced each result
ALTER TABLE chatgpt_citation_results ADD COLUMN IF NOT EXISTS provider TEXT;

