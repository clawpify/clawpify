import type { ConsignmentListingDto, ListListingsQuery } from "../types";

export type { CreateListingBody, ListListingsQuery } from "../types";

export function listingsListPath(query?: ListListingsQuery): string {
  const p = new URLSearchParams();
  if (query?.status) p.set("status", query.status);
  if (query?.limit != null) p.set("limit", String(query.limit));
  if (query?.offset != null) p.set("offset", String(query.offset));
  const qs = p.toString();
  return `/api/listings${qs ? `?${qs}` : ""}`;
}

export const listingsCreatePath = "/api/listings";

export function listingsDetailPath(id: string): string {
  return `/api/listings/${encodeURIComponent(id)}`;
}

async function parseErrorJson(res: Response): Promise<string> {
  let detail = res.statusText;
  try {
    const body = (await res.json()) as { error?: string };
    if (body?.error) detail = body.error;
  } catch {
    /* ignore */
  }
  return detail || `HTTP ${res.status}`;
}

export async function parseListingsResponse(res: Response): Promise<ConsignmentListingDto[]> {
  if (!res.ok) {
    throw new Error(await parseErrorJson(res));
  }
  return res.json() as Promise<ConsignmentListingDto[]>;
}

export async function parseListingResponse(res: Response): Promise<ConsignmentListingDto> {
  if (!res.ok) {
    throw new Error(await parseErrorJson(res));
  }
  return res.json() as Promise<ConsignmentListingDto>;
}

export async function ensureListingMutationOk(res: Response): Promise<void> {
  if (!res.ok) {
    throw new Error(await parseErrorJson(res));
  }
}
