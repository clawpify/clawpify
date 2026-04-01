import type { ConsignmentListingDto, ProductStatusTab } from "../types";

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

/** Solid dot for detail sidebar (pairs with `statusBadgeClass` semantics). */
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
