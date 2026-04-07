import path from "node:path";
import { serve } from "bun";
import { requireAuth, AuthError } from "./lib/auth";
import { createProxyHandler, proxyToRustPublic } from "./utils/networkFns";
import { generateLlmsTxt, generateRobotsTxt, generateSitemapXml, injectSeoMeta } from "./lib/seo";
import { loadBundledFrontend } from "./server/build-frontend";
import { handleCompleteOnboarding } from "./server/clerk-onboarding";
import { handleProvisionConsignor } from "./server/consignor-provision";
import { handleProductsProcess } from "./server/products-process";

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

const { builtAssets, rawHtml } = await loadBundledFrontend(`${import.meta.dir}/index.html`);

type ProxyPath = string | ((req: Request) => string);

const pathnameOf = (req: Request) => new URL(req.url).pathname;

/** Resolve `/app/foo.js` to bundler key `/foo.js`. */
function bundledAssetKeyCandidates(pathname: string): string[] {
  const normalized = pathname.replace(/\/{2,}/g, "/");
  const oneFileUnderApp = normalized.match(/^\/app\/([^/]+\.[^/]+)$/);
  if (oneFileUnderApp) return [normalized, `/${oneFileUnderApp[1]}`];
  return [normalized];
}

const PUBLIC_DIR = path.resolve(path.join(import.meta.dir, "..", "public"));
const PUBLIC_IMAGE_DIR = path.resolve(PUBLIC_DIR, "image");

function resolvePublicImageFile(req: Request): string | null {
  let decoded = pathnameOf(req);
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    return null;
  }
  const prefix = "/image/";
  if (!decoded.startsWith(prefix)) return null;
  const sub = decoded.slice(prefix.length);
  if (!sub || sub.includes("..") || path.isAbsolute(sub)) return null;
  const abs = path.resolve(PUBLIC_IMAGE_DIR, sub);
  const normImage = path.normalize(PUBLIC_IMAGE_DIR);
  const normAbs = path.normalize(abs);
  if (!normAbs.startsWith(normImage + path.sep) && normAbs !== normImage) return null;
  return abs;
}

const PUBLIC_ROOT_NAMES = new Set([
  "favicon-32.png",
  "apple-touch-icon.png",
  "clawpify-mark.svg",
]);

async function servePublicRoot(pathname: string): Promise<Response | null> {
  const name = pathname.startsWith("/") ? pathname.slice(1) : pathname;
  if (!PUBLIC_ROOT_NAMES.has(name)) return null;
  const file = Bun.file(path.join(import.meta.dir, "../public", name));
  if (!(await file.exists())) return null;
  return new Response(file, {
    headers: { "Content-Type": file.type || "application/octet-stream" },
  });
}

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

const handleLlmsTxt = () =>
  new Response(generateLlmsTxt(), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });

const handleImageAsset = async (req: Request) => {
  const abs = resolvePublicImageFile(req);
  if (!abs) return new Response("Not found", { status: 404 });
  const file = Bun.file(abs);
  if (await file.exists()) {
    return new Response(file, {
      headers: { "Content-Type": file.type || "application/octet-stream" },
    });
  }
  return new Response("Not found", { status: 404 });
};

const handleHealth = (req: Request) => forwardPublic(req);

const isOpenApiOrSwaggerPath = (pathname: string) =>
  pathname === "/api/v1/openapi.json" ||
  pathname === "/api/openapi.json" ||
  pathname.startsWith("/api/v1/swagger-ui") ||
  pathname.startsWith("/api/swagger-ui");

const handleApiReference = (req: Request) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const specPath = "/api/v1/openapi.json";
  const scalarConfig = JSON.stringify(
    {
      theme: "default",
      spec: { url: specPath },
      metaData: { title: "Clawpify API" },
    },
    null,
    2,
  );
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex" />
  <title>Clawpify API Reference</title>
</head>
<body>
  <script id="api-reference" type="application/json">${scalarConfig}</script>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>`;
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
};

const handleWaitlistPost = async (req: Request) => {
  const clientIP = serverRef?.requestIP(req)?.address ?? "unknown";
  try {
    return await forwardPublic(req, { clientIP });
  } catch (e) {
    console.error(
      "POST /api/waitlist proxy failed (check RUST_API_URL reaches the Rust service, or set BUN_PUBLIC_API_BASE for direct browser calls):",
      e
    );
    return Response.json(
      { error: "Waitlist is temporarily unavailable." },
      { status: 502 }
    );
  }
};

const handleHealthz = () =>
  new Response(JSON.stringify({ ok: true, service: "clawpify-bun" }), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

const agentActivityProxy = authProxyHandler("/api/agent-activity");

const routes = {
  "/robots.txt": handleRobotsTxt,
  "/sitemap.xml": handleSitemapXml,
  "/llms.txt": handleLlmsTxt,
  "/healthz": handleHealthz,
  "/image/*": handleImageAsset,

  "/api/health": {
    GET: handleHealth,
  },
  "/api/shield": {
    PUT: authProxyHandler("/api/shield"),
  },
  "/api/llm/agents": {
    POST: authProxyHandler("/api/llm/agents"),
  },
  "/api/llm/agents/stream": {
    POST: authProxyHandler("/api/llm/agents/stream"),
  },
  "/api/agent-activity": {
    GET: agentActivityProxy,
    POST: agentActivityProxy,
  },
  "/api/waitlist": {
    POST: handleWaitlistPost,
  },
  "/api/user/complete-onboarding": {
    POST: handleCompleteOnboarding,
  },
  "/api/consignors/provision": {
    POST: handleProvisionConsignor,
  },
  "/api/products/process": {
    POST: handleProductsProcess,
  },
};

const AUTH_PROXY_PREFIXES = [
  "/api/consignors",
  "/api/contracts",
  "/api/listings",
  "/api/intake",
  "/api/s3",
] as const;

function isEbayOauthPublicPath(pathname: string): boolean {
  if (
    pathname === "/api/v1/oauth/ebay/callback" ||
    pathname.startsWith("/api/v1/go/")
  ) {
    return true;
  }
  if (
    pathname === "/api/oauth/ebay/callback" ||
    pathname.startsWith("/api/go/")
  ) {
    return true;
  }
  return false;
}

function isEbayOauthAuthedGetPath(pathname: string): boolean {
  return (
    pathname === "/api/v1/oauth/ebay/start" ||
    pathname === "/api/oauth/ebay/start" ||
    pathname === "/api/v1/oauth/ebay/status" ||
    pathname === "/api/oauth/ebay/status"
  );
}

const server = serve({
  port,
  routes,

  async fetch(req) {
    const pathname = pathnameOf(req);
    if (pathname === "/api-reference" || pathname === "/docs/api") {
      return handleApiReference(req);
    }
    if (isOpenApiOrSwaggerPath(pathname)) {
      return forwardPublic(req);
    }
    if (isEbayOauthPublicPath(pathname) && (req.method === "GET" || req.method === "HEAD")) {
      return forwardPublic(req);
    }
    if (isEbayOauthAuthedGetPath(pathname) && (req.method === "GET" || req.method === "HEAD")) {
      return authProxyHandler(pathnameOf)(req);
    }
    if (AUTH_PROXY_PREFIXES.some((p) => pathname.startsWith(p))) {
      return authProxyHandler(pathnameOf)(req);
    }
    let asset: Blob | undefined;
    for (const key of bundledAssetKeyCandidates(pathname)) {
      asset = builtAssets.get(key);
      if (asset) break;
    }
    if (asset) {
      return new Response(asset, {
        headers: { "Content-Type": asset.type || "application/octet-stream" },
      });
    }
    const publicRoot = await servePublicRoot(pathname);
    if (publicRoot) return publicRoot;
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
