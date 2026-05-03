import type { AuthPayload } from "../types/auth";
import type { ConsignmentListingDto, ListListingsQuery } from "../app/app/modules/products/types";
import { RUST_API_URL, RUST_PROXY_TIMEOUT_MS } from "../lib/constants";

export type { CreateListingBody, ListListingsQuery } from "../app/app/modules/products/types";

function rustProxyTarget(path: string, search: string): string {
  return `${RUST_API_URL}${path}${search}`;
}

function rustProxyFetchInit(req: Request, headers: Headers): RequestInit {
  return {
    method: req.method,
    headers,
    body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
    signal: AbortSignal.timeout(RUST_PROXY_TIMEOUT_MS),
    redirect: "manual",
  };
}

async function forwardOr502(backendUrl: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(backendUrl, init);
  } catch (e) {
    const aborted =
      e instanceof Error &&
      (e.name === "AbortError" || e.message?.includes("The operation was aborted"));
    const message = aborted ? "Rust API request timed out" : "Rust API unreachable";
    return Response.json({ error: message }, { status: 502 });
  }
}

export type { AuthPayload };

function normalizeOrgId(value: string | undefined | null): string | undefined {
  const t = typeof value === "string" ? value.trim() : "";
  return t.length > 0 ? t : undefined;
}

export function internalOrgScope(auth: AuthPayload): string {
  const org = auth.orgId?.trim();
  if (org) return org;
  return `user:${auth.userId.trim()}`;
}

export async function proxyToRust(
  req: Request,
  path: string,
  auth: AuthPayload
): Promise<Response> {
  const url = new URL(req.url);
  const backendUrl = rustProxyTarget(path, url.search);
  const headers = new Headers(req.headers);

  const tokenOrgId = normalizeOrgId(auth.orgId);
  const authForProxy: AuthPayload = {
    ...auth,
    orgId: tokenOrgId ?? auth.orgId,
  };

  headers.set("X-Internal-User-Id", auth.userId);
  headers.set("X-Internal-Org-Id", internalOrgScope(authForProxy));
  if (auth.orgRole) headers.set("X-Internal-Org-Role", auth.orgRole);

  const res = await forwardOr502(backendUrl, rustProxyFetchInit(req, headers));

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
  });
}

export async function proxyToRustPublic(
  req: Request,
  path: string,
  opts?: { clientIP?: string; auth?: AuthPayload }
): Promise<Response> {
  const url = new URL(req.url);
  const backendUrl = rustProxyTarget(path, url.search);
  const headers = new Headers(req.headers);

  if (opts?.clientIP) headers.set("X-Client-IP", opts.clientIP);

  if (opts?.auth) {
    headers.set("X-Internal-User-Id", opts.auth.userId);
    headers.set("X-Internal-Org-Id", internalOrgScope(opts.auth));
    if (opts.auth.orgRole) headers.set("X-Internal-Org-Role", opts.auth.orgRole);
  }

  const res = await forwardOr502(backendUrl, rustProxyFetchInit(req, headers));

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
  });
}

export function createProxyHandler(
  pathOrResolver: string | ((req: Request) => string),
  AuthError: new (message: string) => Error,
  requireAuth: (req: Request) => Promise<AuthPayload>
) {
  return async (req: Request): Promise<Response> => {
    try {
      const auth = await requireAuth(req);
      const path =
        typeof pathOrResolver === "function" ? pathOrResolver(req) : pathOrResolver;

      return proxyToRust(req, path, auth);
    } catch (e) {
      if (e instanceof AuthError) {
        return Response.json({ error: e.message }, { status: 401 });
      }

      throw e;
    }
  };
}

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

export const ebayOAuthStatusPath = "/api/oauth/ebay/status";

export function ebayOAuthStartPath(opts?: { reconnect?: boolean }): string {
  const params = new URLSearchParams();
  if (opts?.reconnect) params.set("reconnect", "1");
  const qs = params.toString();
  return `/api/oauth/ebay/start${qs ? `?${qs}` : ""}`;
}

export function ebaySellerSetupPath(marketplaceId = "EBAY_US", localPickup = false): string {
  const params = new URLSearchParams({
    marketplace_id: marketplaceId,
    local_pickup: String(localPickup),
  });
  return `/api/ebay/seller/setup?${params.toString()}`;
}

export function ebayPoliciesPath(marketplaceId = "EBAY_US"): string {
  const params = new URLSearchParams({ marketplace_id: marketplaceId });
  return `/api/ebay/policies?${params.toString()}`;
}

export const ebayPolicyDefaultsPath = "/api/ebay/policies/defaults";

export function listingEbayDraftPath(listingId: string): string {
  return `/api/listings/${encodeURIComponent(listingId)}/ebay/draft`;
}

export function listingEbayPublishPath(listingId: string): string {
  return `/api/listings/${encodeURIComponent(listingId)}/ebay/publish`;
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
