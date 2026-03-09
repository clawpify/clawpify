const RUST_API_URL = process.env.RUST_API_URL ?? "http://127.0.0.1:3000";

export type AuthPayload = {
  userId: string;
  orgId?: string;
  orgRole?: string;
};

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

export async function proxyToRustPublic(
  req: Request,
  path: string
): Promise<Response> {
  const url = new URL(req.url);
  const backendUrl = `${RUST_API_URL}${path}${url.search}`;

  const res = await fetch(backendUrl, {
    method: req.method,
    headers: req.headers,
    body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
  });

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
