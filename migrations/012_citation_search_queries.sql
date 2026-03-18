-- Canonical search query list (OpenAI Responses `input` per call); queue timing.
ALTER TABLE chatgpt_citations ADD COLUMN IF NOT EXISTS search_queries JSONB;
ALTER TABLE chatgpt_citations ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

-- Legacy rows only stored summary text in product_description; rebuild template queries
-- (must match backend/src/services/citation/prompts.rs FALLBACK_QUERIES).
UPDATE chatgpt_citations
SET search_queries = jsonb_build_array(
  REPLACE(
    'What are the best {} tools or solutions? List specific companies and products with sources.',
    '{}',
    product_description
  ),
  REPLACE('Recommend {} for B2B. Which companies should I consider?', '{}', product_description),
  REPLACE('Top {} products and vendors', '{}', product_description),
  REPLACE('Compare {} solutions. Which ones are worth trying?', '{}', product_description),
  REPLACE('I need {} for my business. What do you recommend?', '{}', product_description)
)
WHERE search_queries IS NULL;

ALTER TABLE chatgpt_citations ALTER COLUMN search_queries SET NOT NULL;

ALTER TABLE chatgpt_citations DROP COLUMN IF EXISTS product_description;

ALTER TABLE chatgpt_citations
  DROP CONSTRAINT IF EXISTS fk_chatgpt_citations_org;
ALTER TABLE chatgpt_citations
  ADD CONSTRAINT fk_chatgpt_citations_org
  FOREIGN KEY (org_id) REFERENCES organizations(id)
  NOT VALID;
