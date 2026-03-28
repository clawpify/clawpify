-- Canonical table name for consignment/reseller inventory.
ALTER TABLE reseller_listings RENAME TO consignment_listings;

ALTER INDEX IF EXISTS idx_reseller_listings_org_created
  RENAME TO idx_consignment_listings_org_created;

ALTER TABLE consignment_listings
  RENAME CONSTRAINT reseller_listings_suggested_price_non_negative
  TO consignment_listings_suggested_price_non_negative;
