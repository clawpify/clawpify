-- Agent activity for observability (Linear-style)
CREATE TABLE IF NOT EXISTS agent_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  store_id UUID REFERENCES stores(id),
  agent_name TEXT NOT NULL,
  action_type TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_activity_org ON agent_activity(org_id);
CREATE INDEX IF NOT EXISTS idx_agent_activity_created ON agent_activity(created_at DESC);
