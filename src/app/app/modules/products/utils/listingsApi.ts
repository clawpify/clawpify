import type { ConsignmentListingDto } from "../types";

export type ListListingsQuery = {
  status?: string;
  limit?: number;
  offset?: number;
};

export function listingsListPath(query?: ListListingsQuery): string {
  const p = new URLSearchParams();
  if (query?.status) p.set("status", query.status);
  if (query?.limit != null) p.set("limit", String(query.limit));
  if (query?.offset != null) p.set("offset", String(query.offset));
  const qs = p.toString();
  return `/api/listings${qs ? `?${qs}` : ""}`;
}

export async function parseListingsResponse(res: Response): Promise<ConsignmentListingDto[]> {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) detail = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(detail || `HTTP ${res.status}`);
  }
  return res.json() as Promise<ConsignmentListingDto[]>;
}
