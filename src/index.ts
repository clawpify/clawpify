import { serve } from "bun";
import index from "./index.html";
import { getAuthOptional, requireAuth, AuthError } from "./lib/auth";
import { createProxyHandler, proxyToRustPublic } from "./utils/networkFns";
import { scrapeUrlForContent } from "./utils/scrape";

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

const proxy = (path: string | ((req: Request) => string)) =>
  createProxyHandler(path, AuthError, requireAuth);

let serverRef: { requestIP: (r: Request) => { address: string } | null } | null = null;

async function proxyCitation(req: Request, path: string, body?: string): Promise<Response> {
  const clientIP = serverRef?.requestIP(req)?.address ?? "unknown";
  const auth = await getAuthOptional(req);
  const reqToForward = body
    ? new Request(req.url, {
        method: req.method,
        headers: new Headers(req.headers),
        body,
      })
    : req;
  return proxyToRustPublic(reqToForward, path, { clientIP, auth });
}

const server = serve({
  port,
  routes: {
    "/image/*": async (req) => {
      const pathname = new URL(req.url).pathname;
      const filePath = `public${pathname}`;
      const file = Bun.file(filePath);
      if (await file.exists()) {
        return new Response(file, {
          headers: { "Content-Type": file.type },
        });
      }
      return new Response("Not found", { status: 404 });
    },

    "/*": index,

    "/api/hello": {
      async GET() {
        return Response.json({ message: "Hello, world!", method: "GET" });
      },
      async PUT() {
        return Response.json({ message: "Hello, world!", method: "PUT" });
      },
    },

    "/api/hello/:name": async req => {
      return Response.json({
        message: `Hello, ${req.params.name}!`,
      });
    },

    "/api/health": {
      async GET(req) {
        const path = new URL(req.url).pathname;
        return proxyToRustPublic(req, path);
      },
    },
    "/api/radar": { async GET(req) { return proxy("/api/radar")(req); } },
    "/api/shield": { async PUT(req) { return proxy("/api/shield")(req); } },

    "/api/stores": {
      async GET(req) { return proxy("/api/stores")(req); },
      async POST(req) { return proxy("/api/stores")(req); },
    },
    "/api/ai-visibility/products": {
      async GET(req) { return proxy("/api/ai-visibility/products")(req); },
    },
    "/api/agent-activity": {
      async GET(req) { return proxy("/api/agent-activity")(req); },
      async POST(req) { return proxy("/api/agent-activity")(req); },
    },

    "/api/chatgpt-citation/generate": {
      async POST(req) {
        const path = new URL(req.url).pathname;
        const body = (await req.json()) as {
          company_name?: string;
          website_url?: string;
          website_content?: string;
        };
        let bodyToForward = body;
        if (body.website_url?.trim() && !body.website_content?.trim()) {
          const content = await scrapeUrlForContent(body.website_url);
          if (content) bodyToForward = { ...body, website_content: content };
        }
        const bodyStr = JSON.stringify(bodyToForward);
        return proxyCitation(req, path, bodyStr);
      },
    },

    "/api/chatgpt-citation": {
      async POST(req) {
        const path = new URL(req.url).pathname;
        const body = await req.text();
        return proxyCitation(req, path, body || undefined);
      },
    },

    "/api/chatgpt-citation/:id": {
      async GET(req) {
        const path = new URL(req.url).pathname;
        return proxyCitation(req, path);
      },
    },

    "/api/waitlist": {
      async POST(req) {
        const path = new URL(req.url).pathname;
        const clientIP = serverRef?.requestIP(req)?.address ?? "unknown";
        const auth = await getAuthOptional(req);
        return proxyToRustPublic(req, path, { clientIP, auth });
      },
    },

    "/api/user/complete-onboarding": {
      async POST(req) {
        try {
          const auth = await requireAuth(req);
          const { clerkClient } = await import("./lib/clerk.ts");
          if (!clerkClient) {
            return Response.json(
              { error: "Clerk not configured" },
              { status: 500 }
            );
          }
          const body = (await req.json()) as {
            firstName?: string;
            lastName?: string;
          };
          if (
            body.firstName != null ||
            body.lastName != null
          ) {
            await clerkClient.users.updateUser(auth.userId, {
              ...(body.firstName != null && { firstName: body.firstName }),
              ...(body.lastName != null && { lastName: body.lastName }),
            });
          }
          await clerkClient.users.updateUserMetadata(auth.userId, {
            publicMetadata: { onboardingComplete: true },
          });
          return Response.json({ success: true });
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
    hmr: true,
    console: true,
  },
});

serverRef = server;
console.log(`🚀 Server running at ${server.url}`);
