import { useEffect, useMemo, useState } from "react";
import { useAuthenticatedFetch } from "../../../../../lib/api";
import type { ConsignmentListingDto } from "../types";
import { listingPrimaryImageUrl } from "../utils/listingMedia";
import {
  listingImageSrc,
  listingImagesPath,
  type ListingImageApiRow,
} from "../utils/listingsApi";

/** `media_urls` first; otherwise first stored image (`url` from API or `/api/s3/objects?key=...`). */
export function useListingStoredImageThumb(listing: ConsignmentListingDto): string | null {
  const fetchAuth = useAuthenticatedFetch();
  const fromMedia = useMemo(() => listingPrimaryImageUrl(listing), [listing]);
  const [s3Src, setS3Src] = useState<string | null>(null);

  useEffect(() => {
    if (fromMedia) {
      setS3Src(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const ir = await fetchAuth(listingImagesPath(listing.id));
        if (!ir.ok || cancelled) return;
        const rows = (await ir.json()) as ListingImageApiRow[];
        const first = rows[0];
        if (!first || cancelled) return;
        setS3Src(listingImageSrc(first));
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
      setS3Src(null);
    };
  }, [listing.id, listing.updated_at, fromMedia, fetchAuth]);

  return fromMedia ?? s3Src;
}
