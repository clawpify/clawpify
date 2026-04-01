import { copy } from "../../../utils/copy";
import type { ConsignmentListingDto } from "../types";

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

/** Synthetic activity rows (no audit API). */
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
