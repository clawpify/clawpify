-- ChatGPT citation tool (free, no-auth)
CREATE TABLE IF NOT EXISTS chatgpt_citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  product_description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS chatgpt_citation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citation_id UUID NOT NULL REFERENCES chatgpt_citations(id),
  query TEXT NOT NULL,
  response_text TEXT,
  citation_urls JSONB,
  mentioned_brands JSONB,
  your_product_mentioned BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chatgpt_citation_results_citation ON chatgpt_citation_results(citation_id);
