-- Reseller drafts and Shopify channel credentials.
-- Columns mirror Shopify Admin API: Product (title, descriptionHtml, productType, vendor, tags),
-- default Variant (price + sku), Media (image URLs → staged upload).
--
-- Copy the block below into a Markdown file to render the diagram.
--
-- ```mermaid
-- erDiagram
--   organizations ||--o{ reseller_listings : owns
--   organizations ||--o{ channel_connections : owns
--   reseller_listings ||--o{ listing_publications : has
--   channel_connections ||--o{ listing_publications : uses
--
--   reseller_listings {
--     uuid id PK
--     string org_id FK
--     string created_by_user_id
--     string status
--     string title
--     string description_html
--     string product_type
--     string vendor
--     string tags
--     int price_cents
--     string currency_code
--     string sku
--     json media_urls
--     datetime created_at
--     datetime updated_at
--   }
--
--   channel_connections {
--     uuid id PK
--     string org_id FK
--     string channel
--     string shop_domain
--     string scopes
--     bytes access_token_ciphertext
--     bytes access_token_nonce
--     datetime token_expires_at
--     datetime created_at
--     datetime updated_at
--   }
--
--   listing_publications {
--     uuid id PK
--     uuid listing_id FK
--     uuid channel_connection_id FK
--     string channel
--     string shopify_product_gid
--     string status
--     string error_message
--     json payload_snapshot
--     datetime created_at
--   }
-- ```

CREATE TABLE IF NOT EXISTS reseller_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL REFERENCES organizations(id),
  created_by_user_id TEXT,
  -- Local workflow (draft -> published); not the same as Shopify Product.status.
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'publishing', 'published', 'failed')),
  -- Mirrors Shopify Product fields sent to productCreate / productUpdate.
  title TEXT NOT NULL,
  description_html TEXT NOT NULL DEFAULT '',
  product_type TEXT NOT NULL DEFAULT '',
  vendor TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  -- Default variant selling plan (variant price on Shopify).
  price_cents BIGINT NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'USD',
  sku TEXT NOT NULL DEFAULT '',
  -- HTTPS image URLs → staged uploads → productCreateMedia.
  media_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS channel_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL REFERENCES organizations(id),
  channel TEXT NOT NULL CHECK (channel IN ('shopify', 'ebay')),
  shop_domain TEXT NOT NULL DEFAULT '',
  scopes TEXT,
  access_token_ciphertext BYTEA NOT NULL,
  access_token_nonce BYTEA NOT NULL,
  token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_channel_connections_org_channel UNIQUE (org_id, channel)
);

CREATE TABLE IF NOT EXISTS listing_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES reseller_listings(id) ON DELETE CASCADE,
  channel_connection_id UUID NOT NULL REFERENCES channel_connections(id) ON DELETE RESTRICT,
  channel TEXT NOT NULL CHECK (channel IN ('shopify', 'ebay')),
  shopify_product_gid TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  error_message TEXT,
  payload_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reseller_listings_org_created ON reseller_listings(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listing_publications_listing ON listing_publications(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_publications_channel ON listing_publications(channel_connection_id);
