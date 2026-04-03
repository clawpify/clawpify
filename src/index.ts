import path from "node:path";
import { serve } from "bun";
import { requireAuth, AuthError } from "./lib/auth";
import { createProxyHandler, proxyToRustPublic } from "./utils/networkFns";
import { generateLlmsTxt, generateRobotsTxt, generateSitemapXml, injectSeoMeta } from "./lib/seo";
import { logAndValidateRustProxy } from "./proxy-safety";
import { loadBundledFrontend } from "./server/build-frontend";
import { handleCompleteOnboarding } from "./server/clerk-onboarding";
import { handleProvisionConsignor } from "./server/consignor-provision";
import { handleProductsProcess } from "./server/products-process";

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

const { builtAssets, rawHtml } = await loadBundledFrontend(`${import.meta.dir}/index.html`);

type ProxyPath = string | ((req: Request) => string);

const pathnameOf = (req: Request) => new URL(req.url).pathname;

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

/** Files in `/public` linked at site root (favicon, Clerk `logoImageUrl`, legacy mark). */
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

/** Does not call Rust — use for Railway/load balancer liveness so health probes cannot proxy-loop. */
const handleHealthz = () =>
  new Response(JSON.stringify({ ok: true, service: "clawpify-bun" }), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

/** GET + POST share one proxied handler instance. */
const agentActivityProxy = authProxyHandler("/api/agent-activity");

logAndValidateRustProxy(port);

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

const server = serve({
  port,
  routes,

  async fetch(req) {
    const pathname = pathnameOf(req);
    if (AUTH_PROXY_PREFIXES.some((p) => pathname.startsWith(p))) {
      return authProxyHandler(pathnameOf)(req);
    }
    const asset = builtAssets.get(pathname);
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
