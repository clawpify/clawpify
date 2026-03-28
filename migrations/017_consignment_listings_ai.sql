-- AI-assisted intake and pricing fields (table still named reseller_listings until 018).
ALTER TABLE reseller_listings
  ADD COLUMN IF NOT EXISTS ai_quality JSONB,
  ADD COLUMN IF NOT EXISTS ai_attributes JSONB,
  ADD COLUMN IF NOT EXISTS suggested_price_cents BIGINT;

ALTER TABLE reseller_listings
  ADD CONSTRAINT reseller_listings_suggested_price_non_negative
  CHECK (suggested_price_cents IS NULL OR suggested_price_cents >= 0);
