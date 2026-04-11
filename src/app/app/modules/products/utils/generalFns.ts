import DOMPurify from "dompurify";
import { marked } from "marked";
import TurndownService from "turndown";
import { copy } from "../../../utils/copy";
import type { ConsignmentListingDto, ProductStatusTab } from "../types";

export function formatListingPrice(cents: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode || "USD",
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currencyCode}`;
  }
}

export function centsToPriceInputString(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function parsePriceInputToCents(raw: string): number | null {
  const t = raw.trim().replace(/,/g, "");
  if (t === "") return null;
  const n = Number.parseFloat(t);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.max(0, Math.round(n * 100));
}

export function formatListingAge(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 45) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
  return `${Math.floor(s / 604800)}w`;
}

const turndown = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-",
});

export function htmlToMarkdown(html: string): string {
  const h = html?.trim() ?? "";
  if (!h) return "";
  return turndown.turndown(h);
}

export function markdownToSafeHtml(markdown: string): string {
  const raw = marked.parse(markdown.trim() || "", { async: false }) as string;
  return DOMPurify.sanitize(raw);
}

export function plainTextToDescriptionHtml(text: string): string {
  const t = text.trim();
  if (!t) return "";
  const esc = t
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\r\n/g, "\n");
  const parts = esc.split("\n");
  return parts.map((line) => (line === "" ? "<br />" : `<p>${line}</p>`)).join("");
}

const IMAGE_FILENAME_EXT = /\.(jpe?g|png|gif|webp|avif|heif|heic|bmp|tif?f|svg)$/i;

export function isSelectableImageFile(file: File): boolean {
  const t = file.type.trim();
  if (t.startsWith("image/")) return true;
  if (t === "" && IMAGE_FILENAME_EXT.test(file.name)) return true;
  return false;
}

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

export function listingPrimaryImageUrl(listing: ConsignmentListingDto): string | null {
  const urls = listingImageUrls(listing);
  return urls[0] ?? null;
}

export type { ProductStatusTab };

export function filterProductListings(
  listings: ConsignmentListingDto[],
  tab: ProductStatusTab,
  searchQuery: string
): ConsignmentListingDto[] {
  const q = searchQuery.trim().toLowerCase();
  return listings.filter((l) => {
    if (!listingMatchesTab(l, tab)) return false;
    if (!q) return true;
    return (
      l.title.toLowerCase().includes(q) ||
      l.sku.toLowerCase().includes(q) ||
      l.vendor.toLowerCase().includes(q)
    );
  });
}

export function listingMatchesTab(listing: ConsignmentListingDto, tab: ProductStatusTab): boolean {
  const s = listing.status.toLowerCase();
  if (tab === "all") return true;
  if (tab === "draft") return s === "draft";
  if (tab === "active") return s === "published" || s === "ready" || s === "publishing";
  if (tab === "archived") return s === "failed";
  return true;
}

export function statusBadgeClass(status: string): string {
  const s = status.toLowerCase();
  if (s === "published" || s === "ready" || s === "publishing") {
    return "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-600/20";
  }
  if (s === "draft") {
    return "bg-zinc-100 text-zinc-700 ring-1 ring-inset ring-zinc-500/15";
  }
  if (s === "failed") {
    return "bg-red-50 text-red-800 ring-1 ring-inset ring-red-600/15";
  }
  return "bg-zinc-100 text-zinc-700 ring-1 ring-inset ring-zinc-500/15";
}

export function statusDotClass(status: string): string {
  const s = status.toLowerCase();
  if (s === "published" || s === "ready" || s === "publishing") {
    return "bg-emerald-500";
  }
  if (s === "draft") {
    return "bg-zinc-400";
  }
  if (s === "failed") {
    return "bg-red-500";
  }
  return "bg-zinc-400";
}

function tokenizeSku(input: string): string[] {
  return input
    .toUpperCase()
    .replace(/[^A-Z0-9\s]+/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

export function suggestListingSku(
  brandOrVendor: string,
  titleOrModel: string,
  idHint?: string
): string {
  const brandTokens = tokenizeSku(brandOrVendor);
  const titleTokens = tokenizeSku(titleOrModel);
  const brand = brandTokens[0] ?? titleTokens[0] ?? "ITEM";
  const model = titleTokens.find((token) => token !== brand) ?? titleTokens[1] ?? "MODEL";
  const suffix =
    idHint?.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(-4) || "0001";

  return `${brand.slice(0, 4)}-${model.slice(0, 6)}-${suffix}`;
}

export type ListingTimelineEvent = {
  id: string;
  body: string;
};

function formatTimelineDate(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return iso;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function buildListingTimelineEvents(listing: ConsignmentListingDto): ListingTimelineEvent[] {
  const rows: ListingTimelineEvent[] = [
    {
      id: "created",
      body: `${copy.products.timelineListingCreated} · ${formatTimelineDate(listing.created_at)}`,
    },
  ];

  if (listing.updated_at && listing.updated_at !== listing.created_at) {
    rows.push({
      id: "updated",
      body: `${copy.products.timelineLastUpdated} · ${formatTimelineDate(listing.updated_at)}`,
    });
  }

  const statusLabel = listing.status.replaceAll("_", " ");
  rows.push({
    id: "status",
    body: `${copy.products.timelineCurrentStatus}: ${statusLabel}`,
  });

  return rows;
}

/** Matches sidebar `DetailRailCard` chrome. */
export const RAIL_CARD_SHADOW =
  "shadow-[0_1px_3px_rgba(15,23,42,0.08),0_1px_2px_-1px_rgba(15,23,42,0.06)]";

export const listingMediaHeroFrame = `overflow-hidden rounded-lg border border-zinc-200/80 bg-zinc-100 ${RAIL_CARD_SHADOW}`;

/** Empty / drop-target chrome: dashed border reads as an upload zone. */
export const listingMediaEmptyHeroFrame = `overflow-hidden rounded-lg border-2 border-dashed border-zinc-200/90 bg-zinc-50/90 ${RAIL_CARD_SHADOW}`;

