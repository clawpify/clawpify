import type { ConsignmentListingDto } from "../types";

/**
 * `media_urls` contract (GET listing): array of HTTPS/data URLs and/or same-origin stored-image paths
 * (`/api/s3/objects?key=...`). The gallery also merges `GET /api/listings/:id/images`; see `useListingGalleryImageUrls`.
 */

/** Browsers often omit `File.type` (drag-drop, some folders); fall back on extension. */
const IMAGE_FILENAME_EXT = /\.(jpe?g|png|gif|webp|avif|heif|heic|bmp|tif?f|svg)$/i;

export function isSelectableImageFile(file: File): boolean {
  const t = file.type.trim();
  if (t.startsWith("image/")) return true;
  if (t === "" && IMAGE_FILENAME_EXT.test(file.name)) return true;
  return false;
}

/** Public URLs, data URIs, or same-origin S3 proxy paths returned by the listings/images API. */
export function isDisplayableListingImageUrl(s: string): boolean {
  const t = s.trim();
  if (/^https?:\/\//i.test(t) || /^data:image\//i.test(t)) return true;
  if (/^blob:/i.test(t)) return true;
  try {
    const base = typeof window !== "undefined" ? window.location.origin : "http://localhost";
    const u = new URL(t, base);
    return u.pathname === "/api/s3/objects" && u.searchParams.has("key");
  } catch {
    return false;
  }
}

function urlFromMediaItem(item: unknown): string | null {
  if (typeof item === "string") {
    const t = item.trim();
    if (isDisplayableListingImageUrl(t)) return t;
    return null;
  }
  if (item && typeof item === "object" && "url" in item) {
    const u = (item as { url?: unknown }).url;
    if (typeof u === "string") {
      const t = u.trim();
      if (isDisplayableListingImageUrl(t)) return t;
    }
  }
  return null;
}

/** All valid HTTP(S) or data image URLs from `media_urls`, in order, deduped. */
export function listingImageUrls(listing: ConsignmentListingDto): string[] {
  const raw = listing.media_urls;
  if (raw == null || !Array.isArray(raw)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const u = urlFromMediaItem(item);
    if (u && !seen.has(u)) {
      seen.add(u);
      out.push(u);
    }
  }
  return out;
}

/** First image URL from `media_urls`, or `null` for placeholder. */
export function listingPrimaryImageUrl(listing: ConsignmentListingDto): string | null {
  const urls = listingImageUrls(listing);
  return urls[0] ?? null;
}
