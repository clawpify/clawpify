-- listing_publications must reference consignment_listings (018 renamed reseller_listings).
-- Re-point FK for DBs that predate 018 or have a stale constraint name/target.
ALTER TABLE listing_publications
  DROP CONSTRAINT IF EXISTS listing_publications_listing_id_fkey;

ALTER TABLE listing_publications
  ADD CONSTRAINT listing_publications_listing_id_fkey
  FOREIGN KEY (listing_id) REFERENCES consignment_listings(id) ON DELETE CASCADE;
