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

export function listingByIdPath(id: string): string {
  return `/api/listings/${encodeURIComponent(id)}`;
}

export const listingsCreatePath = "/api/listings";

export function listingsDetailPath(id: string): string {
  return `/api/listings/${encodeURIComponent(id)}`;
}

export function listingImagesPath(listingId: string): string {
  return `/api/listings/${encodeURIComponent(listingId)}/images`;
}

export type ListingImageApiRow = {
  storage_key: string;
  url?: string;
};

export function listingImageSrc(row: ListingImageApiRow): string {
  const u = row.url?.trim();
  if (u) return u;
  return `/api/s3/objects?key=${encodeURIComponent(row.storage_key)}`;
}

export async function parseApiErrorJson(res: Response): Promise<string> {
  let detail = res.statusText;
  try {
    const body = (await res.json()) as {
      error?: string | { message?: string };
    };
    const err = body?.error;
    if (typeof err === "string" && err.trim()) {
      detail = err;
    } else if (err && typeof err === "object" && typeof err.message === "string" && err.message.trim()) {
      detail = err.message;
    }
  } catch {
    /* ignore */
  }
  return detail || `HTTP ${res.status}`;
}

export async function parseListingsResponse(res: Response): Promise<ConsignmentListingDto[]> {
  if (!res.ok) {
    throw new Error(await parseApiErrorJson(res));
  }
  return res.json() as Promise<ConsignmentListingDto[]>;
}

export async function parseListingResponse(res: Response): Promise<ConsignmentListingDto> {
  if (!res.ok) {
    throw new Error(await parseApiErrorJson(res));
  }
  return res.json() as Promise<ConsignmentListingDto>;
}

export async function ensureListingMutationOk(res: Response): Promise<void> {
  if (!res.ok) {
    throw new Error(await parseApiErrorJson(res));
  }
}

export function s3ObjectsUploadPath(listingId: string, fileName: string): string {
  const p = new URLSearchParams();
  p.set("listing_id", listingId);
  p.set("file_name", fileName);
  return `/api/s3/objects?${p.toString()}`;
}

export async function uploadListingObject(
  fetchAuth: (path: string, init?: RequestInit) => Promise<Response>,
  listingId: string,
  file: File
): Promise<void> {
  const res = await fetchAuth(s3ObjectsUploadPath(listingId, file.name), {
    method: "POST",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!res.ok) {
    throw new Error(await parseApiErrorJson(res));
  }
}
