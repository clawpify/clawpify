-- Object metadata for POST /api/v1/s3/objects (direct upload) and GET presigned redirect.
CREATE TABLE stored_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL REFERENCES organizations(id),
  uploaded_by_user_id TEXT NOT NULL,
  storage_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL,
  byte_size BIGINT NOT NULL CHECK (byte_size >= 0),
  original_file_name TEXT NOT NULL,
  listing_id UUID REFERENCES consignment_listings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stored_images_org_created ON stored_images (org_id, created_at DESC);
