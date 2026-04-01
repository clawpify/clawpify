import type { ConsignmentListingDto } from "../types";

function isValidImageUrl(s: string): boolean {
  const t = s.trim();
  return /^https?:\/\//i.test(t) || /^data:image\//i.test(t);
}

function urlFromMediaItem(item: unknown): string | null {
  if (typeof item === "string") {
    const t = item.trim();
    if (isValidImageUrl(t)) return t;
    return null;
  }
  if (item && typeof item === "object" && "url" in item) {
    const u = (item as { url?: unknown }).url;
    if (typeof u === "string") {
      const t = u.trim();
      if (isValidImageUrl(t)) return t;
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
