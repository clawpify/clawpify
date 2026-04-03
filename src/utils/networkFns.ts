const RUST_API_URL = process.env.RUST_API_URL ?? "http://127.0.0.1:3000";

function rustProxyFetchInit(req: Request, headers: Headers): RequestInit {
  const raw = process.env.RUST_PROXY_TIMEOUT_MS;
  const parsed = raw != null && raw !== "" ? parseInt(raw, 10) : 25_000;
  const ms = Number.isFinite(parsed) && parsed > 0 ? parsed : 25_000;
  return {
    method: req.method,
    headers,
    body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
    signal: AbortSignal.timeout(ms),
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

export type AuthPayload = {
  userId: string;
  orgId?: string;
  orgRole?: string;
};

function normalizeOrgId(value: string | undefined | null): string | undefined {
  const t = typeof value === "string" ? value.trim() : "";
  return t.length > 0 ? t : undefined;
}

/** Clerk active org id, or synthetic `user:<clerk_sub>` when signed in without an organization. */
export function internalOrgScope(auth: AuthPayload): string {
  const org = auth.orgId?.trim();
  if (org) return org;
  return `user:${auth.userId.trim()}`;
}

/**
 * Proxy an authenticated request to the Rust API.
 *
 * @param req - The incoming request to forward.
 * @param path - The backend path to proxy to.
 * @param auth - Auth payload injected as internal headers.
 * @returns The response from the Rust API.
 */
export async function proxyToRust(
  req: Request,
  path: string,
  auth: AuthPayload
): Promise<Response> {
  const url = new URL(req.url);
  const backendUrl = `${RUST_API_URL}${path}${url.search}`;
  const headers = new Headers(req.headers);

  const selectedOrgId = normalizeOrgId(req.headers.get("X-Selected-Org-Id"));
  const tokenOrgId = normalizeOrgId(auth.orgId);
  const resolvedOrgId =
    tokenOrgId ??
    (process.env.NODE_ENV !== "production" && selectedOrgId?.startsWith("org_")
      ? selectedOrgId
      : undefined);

  const authForProxy: AuthPayload = {
    ...auth,
    orgId: resolvedOrgId ?? auth.orgId,
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

/**
 * Proxy a public (optionally authenticated) request to the Rust API.
 *
 * @param req - The incoming request to forward.
 * @param path - The backend path to proxy to.
 * @param opts - Optional client IP and auth payload to inject as internal headers.
 * @returns The response from the Rust API.
 */
export async function proxyToRustPublic(
  req: Request,
  path: string,
  opts?: { clientIP?: string; auth?: AuthPayload }
): Promise<Response> {
  const url = new URL(req.url);
  const backendUrl = `${RUST_API_URL}${path}${url.search}`;
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

/**
 * Create a route handler that authenticates the request and proxies it to the Rust API.
 *
 * @param pathOrResolver - A static path string or a function that derives the path from the request.
 * @param AuthError - The error class thrown by `requireAuth` on authentication failure.
 * @param requireAuth - Function that validates the request and returns an AuthPayload.
 * @returns An async request handler that proxies authenticated requests to the Rust API.
 */
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
