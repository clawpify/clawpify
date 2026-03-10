import { serve } from "bun";
import index from "./index.html";
import { requireAuth, AuthError } from "./lib/auth";
import { createProxyHandler, proxyToRustPublic } from "./utils/networkFns";
import { scrapeUrlForContent } from "./utils/scrape";

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

const proxy = (path: string | ((req: Request) => string)) =>
  createProxyHandler(path, AuthError, requireAuth);

const server = serve({
  port,
  routes: {
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
        const headers = new Headers(req.headers);
        headers.set("Content-Type", "application/json");
        return proxyToRustPublic(
          new Request(req.url, { method: "POST", headers, body: bodyStr }),
          path
        );
      },
    },

    "/api/chatgpt-citation": {
      async POST(req) {
        const path = new URL(req.url).pathname;
        return proxyToRustPublic(req, path);
      },
    },

    "/api/chatgpt-citation/:id": {
      async GET(req) {
        const path = new URL(req.url).pathname;
        return proxyToRustPublic(req, path);
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

console.log(`🚀 Server running at ${server.url}`);
