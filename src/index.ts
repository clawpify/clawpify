import { serve } from "bun";
import tailwindPlugin from "bun-plugin-tailwind";
import { getAuthOptional, requireAuth, AuthError } from "./lib/auth";
import { createProxyHandler, proxyToRustPublic } from "./utils/networkFns";
import { generateRobotsTxt, generateSitemapXml, injectSeoMeta } from "./lib/seo";

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

const clientDefines: Record<string, string> = {
  "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? "development"),
};
for (const [key, value] of Object.entries(process.env)) {
  if ((key.startsWith("BUN_PUBLIC_") || key.startsWith("VITE_")) && value != null) {
    clientDefines[`process.env.${key}`] = JSON.stringify(value);
  }
}

const frontendBuild = await Bun.build({
  entrypoints: [import.meta.dir + "/index.html"],
  target: "browser",
  sourcemap: "none",
  minify: process.env.NODE_ENV === "production",
  define: clientDefines,
  plugins: [tailwindPlugin],
});

if (!frontendBuild.success) {
  throw new Error("Failed to build frontend bundle from index.html");
}

const builtAssets = new Map<string, Blob>();
let mainBundle: Blob | null = null;
let htmlTemplate = "";
for (const output of frontendBuild.outputs) {
  const fileName = output.path.split("/").pop();
  if (!fileName) continue;
  if (fileName.endsWith(".html")) {
    htmlTemplate = await output.text();
    continue;
  }
  if (!mainBundle && fileName.endsWith(".js")) mainBundle = output;
  builtAssets.set(`/${fileName}`, output);
}

if (!htmlTemplate) {
  throw new Error("Missing built HTML output");
}

const rawHtml = htmlTemplate
  .replaceAll('href="./', 'href="/')
  .replaceAll('src="./', 'src="/');

// Compatibility for cached HTML that still points to /frontend.tsx
if (mainBundle) {
  builtAssets.set("/frontend.tsx", mainBundle);
}

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
  const auth = await getAuthOptional(req);
  try {
    return await forwardPublic(req, { clientIP, auth: auth ?? undefined });
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

const handleCompleteOnboarding = async (req: Request) => {
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

    if (body.firstName != null || body.lastName != null) {
      await clerkClient.users.updateUser(auth.userId, {
        ...(body.firstName != null && { firstName: body.firstName }),
        ...(body.lastName != null && { lastName: body.lastName }),
      });
    }

    await clerkClient.users.updateUserMetadata(auth.userId, {
      publicMetadata: { onboardingComplete: true },
    });

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: 401 });
    }
    throw error;
  }
};

const staticRoutes = {
  "/robots.txt": handleRobotsTxt,
  "/sitemap.xml": handleSitemapXml,
  "/image/*": handleImageAsset,
};

const shieldHandler = authProxyHandler("/api/shield");
const storesHandler = authProxyHandler("/api/stores");
const storeByIdHandler = authProxyHandler(pathnameOf);
const agentActivityHandler = authProxyHandler("/api/agent-activity");
const llmAgentsHandler = authProxyHandler("/api/llm/agents");
const llmAgentsStreamHandler = authProxyHandler("/api/llm/agents/stream");
const priceEstimationHandler = authProxyHandler("/api/price-estimation");

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
  "/api/stores": {
    async GET(req: Request) {
      return storesHandler(req);
    },
    async POST(req: Request) {
      return storesHandler(req);
    },
  },
  "/api/stores/:id": {
    async GET(req: Request) {
      return storeByIdHandler(req);
    },
    async PATCH(req: Request) {
      return storeByIdHandler(req);
    },
    async DELETE(req: Request) {
      return storeByIdHandler(req);
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
  "/api/price-estimation": {
    async POST(req: Request) {
      return priceEstimationHandler(req);
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
};

const server = serve({
  port,
  routes: {
    ...staticRoutes,
    ...apiRoutes,
  },

  fetch(req) {
    const pathname = pathnameOf(req);
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
