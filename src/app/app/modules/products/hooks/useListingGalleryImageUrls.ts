import { useEffect, useMemo, useRef, useState } from "react";
import { useAuthenticatedFetch } from "../../../../../lib/api";
import type { ConsignmentListingDto } from "../types";
import { listingImageUrls } from "../utils/listingMedia";
import {
  listingImageSrc,
  listingImagesPath,
  type ListingImageApiRow,
} from "../utils/listingsApi";

export type ListingGalleryUrlsState = {
  urls: string[];
  /** True until the first `GET .../images` for this listing finishes (or errors). */
  galleryMetaPending: boolean;
};

/** `media_urls` entries first, then stored-image gallery (API `url` or `/api/s3/objects?key=...`). */
export function useListingGalleryImageUrls(
  listing: ConsignmentListingDto,
  /** Bump after uploads so S3 rows refetch even if `listing.updated_at` is unchanged. */
  imageListVersion = 0
): ListingGalleryUrlsState {
  const fetchAuth = useAuthenticatedFetch();
  const fetchAuthRef = useRef(fetchAuth);
  fetchAuthRef.current = fetchAuth;

  const base = useMemo(
    () => listingImageUrls(listing),
    [listing.id, listing.updated_at, listing.media_urls]
  );
  const [s3Urls, setS3Urls] = useState<string[]>([]);
  const [galleryMetaPending, setGalleryMetaPending] = useState(true);
  /** Only reset gallery state when `listing.id` truly changes (avoids fighting the fetch effect on remount). */
  const prevListingIdRef = useRef(listing.id);

  useEffect(() => {
    let cancelled = false;

    if (prevListingIdRef.current !== listing.id) {
      prevListingIdRef.current = listing.id;
      setS3Urls([]);
      setGalleryMetaPending(true);
    }

    (async () => {
      try {
        const ir = await fetchAuthRef.current(listingImagesPath(listing.id));
        if (!ir.ok) {
          if (!cancelled) setGalleryMetaPending(false);
          return;
        }
        const rows = (await ir.json()) as ListingImageApiRow[];
        const next = rows.map(listingImageSrc);
        if (cancelled) return;
        setS3Urls(next);
        setGalleryMetaPending(false);
      } catch {
        if (!cancelled) setGalleryMetaPending(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [listing.id, listing.updated_at, imageListVersion]);

  const urls = useMemo(() => {
    const out: string[] = [];
    const seen = new Set<string>();
    for (const u of [...base, ...s3Urls]) {
      if (seen.has(u)) continue;
      seen.add(u);
      out.push(u);
    }
    return out;
  }, [base, s3Urls]);
  return { urls, galleryMetaPending };
}
