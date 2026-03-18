const RUST_API_URL = process.env.RUST_API_URL ?? "http://127.0.0.1:3000";

export type AuthPayload = {
  userId: string;
  orgId?: string;
  orgRole?: string;
};

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

  headers.set("X-Internal-User-Id", auth.userId);
  if (auth.orgId) headers.set("X-Internal-Org-Id", auth.orgId);
  if (auth.orgRole) headers.set("X-Internal-Org-Role", auth.orgRole);

  const res = await fetch(backendUrl, {
    method: req.method,
    headers,
    body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
  });

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
    if (opts.auth.orgId) headers.set("X-Internal-Org-Id", opts.auth.orgId);
    if (opts.auth.orgRole) headers.set("X-Internal-Org-Role", opts.auth.orgRole);
  }

  const res = await fetch(backendUrl, {
    method: req.method,
    headers,
    body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
  });

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
