CREATE INDEX idx_stored_images_listing ON stored_images (listing_id) WHERE listing_id IS NOT NULL;
