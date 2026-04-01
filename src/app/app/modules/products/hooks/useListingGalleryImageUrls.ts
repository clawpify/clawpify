import { useEffect, useMemo, useState } from "react";
import { useAuthenticatedFetch } from "../../../../../lib/api";
import type { ConsignmentListingDto } from "../types";
import { listingImageUrls } from "../utils/listingMedia";
import {
  listingImageSrc,
  listingImagesPath,
  type ListingImageApiRow,
} from "../utils/listingsApi";

/** `media_urls` entries first, then stored-image gallery (API `url` or `/api/s3/objects?key=...`). */
export function useListingGalleryImageUrls(
  listing: ConsignmentListingDto,
  /** Bump after uploads so S3 rows refetch even if `listing.updated_at` is unchanged. */
  imageListVersion = 0
): string[] {
  const fetchAuth = useAuthenticatedFetch();
  const base = useMemo(() => listingImageUrls(listing), [listing]);
  const [s3Urls, setS3Urls] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const ir = await fetchAuth(listingImagesPath(listing.id));
        if (!ir.ok || cancelled) return;
        const rows = (await ir.json()) as ListingImageApiRow[];
        const next = rows.map(listingImageSrc);
        if (cancelled) return;
        setS3Urls(next);
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
      setS3Urls([]);
    };
  }, [listing.id, listing.updated_at, imageListVersion, fetchAuth]);

  return useMemo(() => [...base, ...s3Urls], [base, s3Urls]);
}
