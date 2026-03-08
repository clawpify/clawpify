import { serve } from "bun";
import index from "./index.html";
import { requireAuth, AuthError } from "./lib/auth";

const RUST_API_URL = process.env.RUST_API_URL ?? "http://127.0.0.1:3000";

async function proxyToRust(
  req: Request,
  path: string,
  auth: { userId: string; orgId?: string; orgRole?: string }
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

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

const server = serve({
  port,
  routes: {
    "/*": index,

    "/api/hello": {
      async GET(req) {
        return Response.json({
          message: "Hello, world!",
          method: "GET",
        });
      },
      async PUT(req) {
        return Response.json({
          message: "Hello, world!",
          method: "PUT",
        });
      },
    },

    "/api/hello/:name": async req => {
      const name = req.params.name;
      return Response.json({
        message: `Hello, ${name}!`,
      });
    },

    "/api/radar": {
      async GET(req) {
        try {
          const auth = await requireAuth(req);
          return proxyToRust(req, "/api/radar", auth);
        } catch (e) {
          if (e instanceof AuthError) {
            return Response.json({ error: e.message }, { status: 401 });
          }
          throw e;
        }
      },
    },

    "/api/shield": {
      async PUT(req) {
        try {
          const auth = await requireAuth(req);
          return proxyToRust(req, "/api/shield", auth);
        } catch (e) {
          if (e instanceof AuthError) {
            return Response.json({ error: e.message }, { status: 401 });
          }
          throw e;
        }
      },
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
