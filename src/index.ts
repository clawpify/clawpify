import { serve } from "bun";
import { requireAuth, AuthError } from "./lib/auth";
import { createProxyHandler, proxyToRustPublic } from "./utils/networkFns";
import { generateRobotsTxt, generateSitemapXml, injectSeoMeta } from "./lib/seo";
import { logAndValidateRustProxy } from "./proxy-safety";
import { loadBundledFrontend } from "./server/build-frontend";
import { handleCompleteOnboarding } from "./server/clerk-onboarding";
import { handleProvisionConsignor } from "./server/consignor-provision";
import { handleProductsProcess } from "./server/products-process";

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

const { builtAssets, rawHtml } = await loadBundledFrontend(
  `${import.meta.dir}/index.html`
);

type ProxyPath = string | ((req: Request) => string);

const pathnameOf = (req: Request) => new URL(req.url).pathname;
const toPublicAssetPath = (req: Request) => `public${pathnameOf(req)}`;

const proxy = (path: ProxyPath) =>
  createProxyHandler(path, AuthError, requireAuth);

const authProxyHandler = (path: ProxyPath) => {
  const handler = proxy(path);
  return (req: Request) => handler(req);
};

const forwardPublic = (
  req: Request,
  options?: Parameters<typeof proxyToRustPublic>[2]
) => proxyToRustPublic(req, pathnameOf(req), options);

let serverRef: { requestIP: (r: Request) => { address: string } | null } | null = null;

const handleRobotsTxt = () =>
  new Response(generateRobotsTxt(), {
    headers: { "Content-Type": "text/plain" },
  });

const handleSitemapXml = () =>
  new Response(generateSitemapXml(), {
    headers: { "Content-Type": "application/xml" },
  });

const handleImageAsset = async (req: Request) => {
  const file = Bun.file(toPublicAssetPath(req));
  if (await file.exists()) {
    return new Response(file, {
      headers: { "Content-Type": file.type },
    });
  }
  return new Response("Not found", { status: 404 });
};

const handleHealth = (req: Request) => forwardPublic(req);

const handleSubscribersPost = async (req: Request) => {
  const clientIP = serverRef?.requestIP(req)?.address ?? "unknown";
  try {
    return await forwardPublic(req, { clientIP });
  } catch (e) {
    console.error(
      "POST /api/subscribers proxy failed (check RUST_API_URL reaches the Rust service, or set BUN_PUBLIC_API_BASE for direct browser calls):",
      e
    );
    return Response.json(
      { error: "Subscription service is temporarily unavailable." },
      { status: 502 }
    );
  }
};

/** Does not call Rust — use for Railway/load balancer liveness so health probes cannot proxy-loop. */
const handleHealthz = () =>
  new Response(JSON.stringify({ ok: true, service: "clawpify-bun" }), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

const staticRoutes = {
  "/robots.txt": handleRobotsTxt,
  "/sitemap.xml": handleSitemapXml,
  "/healthz": handleHealthz,
  "/image/*": handleImageAsset,
};

const shieldHandler = authProxyHandler("/api/shield");
const agentActivityHandler = authProxyHandler("/api/agent-activity");
const llmAgentsHandler = authProxyHandler("/api/llm/agents");
const llmAgentsStreamHandler = authProxyHandler("/api/llm/agents/stream");

logAndValidateRustProxy(port);

const apiRoutes = {
  "/api/health": {
    async GET(req: Request) {
      return handleHealth(req);
    },
  },
  "/api/shield": {
    async PUT(req: Request) {
      return shieldHandler(req);
    },
  },
  "/api/llm/agents": {
    async POST(req: Request) {
      return llmAgentsHandler(req);
    },
  },
  "/api/llm/agents/stream": {
    async POST(req: Request) {
      return llmAgentsStreamHandler(req);
    },
  },
  "/api/agent-activity": {
    async GET(req: Request) {
      return agentActivityHandler(req);
    },
    async POST(req: Request) {
      return agentActivityHandler(req);
    },
  },
  "/api/subscribers": {
    async POST(req: Request) {
      return handleSubscribersPost(req);
    },
  },
  "/api/user/complete-onboarding": {
    async POST(req: Request) {
      return handleCompleteOnboarding(req);
    },
  },
  "/api/consignors/provision": {
    async POST(req: Request) {
      return handleProvisionConsignor(req);
    },
  },
  "/api/products/process": {
    async POST(req: Request) {
      return handleProductsProcess(req);
    },
  },
};

const server = serve({
  port,
  routes: {
    ...staticRoutes,
    ...apiRoutes,
  },

  fetch(req) {
    const pathname = pathnameOf(req);
    if (
      pathname.startsWith("/api/consignors") ||
      pathname.startsWith("/api/contracts") ||
      pathname.startsWith("/api/listings") ||
      pathname.startsWith("/api/intake")
    ) {
      return authProxyHandler(pathnameOf)(req);
    }
    const asset = builtAssets.get(pathname);
    if (asset) {
      return new Response(asset, {
        headers: { "Content-Type": asset.type || "application/octet-stream" },
      });
    }
    if (pathname.includes(".")) {
      return new Response("Not found", { status: 404 });
    }
    return new Response(injectSeoMeta(rawHtml, pathname), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  },

  development: process.env.NODE_ENV !== "production" && {
    console: true,
  },
});

serverRef = server;
console.log(`🚀 Server running at ${server.url}`);
