import { serve } from "bun";
import tailwindPlugin from "bun-plugin-tailwind";
import { getAuthOptional, requireAuth, AuthError } from "./lib/auth";
import { createProxyHandler, proxyToRust, proxyToRustPublic } from "./utils/networkFns";
import { generateRobotsTxt, generateSitemapXml, injectSeoMeta } from "./lib/seo";
import { suggestListingSku } from "./app/app/modules/products/utils/suggestListingSku";

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

const isEmail = (contact: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);

const isPhoneLike = (contact: string) => /^\+?[0-9()\-\s]{7,}$/.test(contact);
const isStrictE164 = (contact: string) => /^\+[1-9]\d{6,14}$/.test(contact);

const splitName = (displayName: string): { firstName: string; lastName?: string } => {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: parts[0] ?? displayName.trim() };
  return {
    firstName: parts[0]!,
    lastName: parts.slice(1).join(" "),
  };
};

const handleProvisionConsignor = async (req: Request) => {
  try {
    const auth = await requireAuth(req);
    const { clerkClient } = await import("./lib/clerk.ts");
    if (!clerkClient) {
      return Response.json({ error: "Clerk not configured" }, { status: 500 });
    }

    const body = (await req.json()) as {
      displayName?: string;
      contact?: string;
      organizationId?: string;
    };

    const displayName = body.displayName?.trim() ?? "";
    const contact = body.contact?.trim() ?? "";
    if (!displayName) {
      return Response.json({ error: "displayName required" }, { status: 400 });
    }
    if (!contact) {
      return Response.json({ error: "contact required" }, { status: 400 });
    }

    const tokenOrgId = auth.orgId;
    const bodyOrgId = body.organizationId;
    const orgId =
      tokenOrgId ??
      (process.env.NODE_ENV !== "production" ? bodyOrgId : undefined);

    if (!orgId || !orgId.startsWith("org_")) {
      return Response.json({ error: "Active organization required" }, { status: 400 });
    }

    const email = isEmail(contact) ? contact.toLowerCase() : undefined;
    const phone = !email && isPhoneLike(contact) ? contact : undefined;
    if (!email && !phone) {
      return Response.json(
        { error: "contact must be a valid email or phone number" },
        { status: 400 }
      );
    }
    if (phone && !isStrictE164(phone)) {
      return Response.json(
        { error: "Phone contact must be E.164 format (e.g. +15551234567)" },
        { status: 400 }
      );
    }

    const { firstName, lastName } = splitName(displayName);
    const user = await (clerkClient.users as any).createUser({
      firstName,
      ...(lastName ? { lastName } : {}),
      ...(email ? { emailAddress: [email] } : {}),
      ...(phone ? { phoneNumber: [phone] } : {}),
      skipPasswordChecks: true,
      skipPasswordRequirement: true,
    });

    await (clerkClient.organizations as any).createOrganizationMembership({
      organizationId: orgId,
      userId: user.id,
      role: "org:member",
    });

    const authWithOrg = { ...auth, orgId };

    const consignorReq = new Request(req.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        display_name: displayName,
        ...(email ? { email } : {}),
        ...(phone ? { phone_e164: phone } : {}),
      }),
    });

    return proxyToRust(consignorReq, "/api/consignors", authWithOrg);
  } catch (error: any) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: 401 });
    }
    const clerkMessage =
      error?.errors?.[0]?.longMessage ??
      error?.errors?.[0]?.message ??
      error?.message;
    if (typeof clerkMessage === "string" && clerkMessage.length > 0) {
      console.error("POST /api/consignors/provision Clerk error:", clerkMessage);
      return Response.json({ error: clerkMessage }, { status: error?.status ?? 422 });
    }
    console.error("POST /api/consignors/provision failed:", error);
    return Response.json({ error: "Failed to create consignor" }, { status: 500 });
  }
};

type ProductProcessInputItem = {
  clientId: string;
  imageDataUrls: string[];
  model: string;
  originalPrice?: number | null;
  isUsed?: boolean;
  notes?: string;
};

type ProductProcessRequest = {
  items?: ProductProcessInputItem[];
};

const DEFAULT_PRODUCT_SYSTEM_PROMPT =
  "You are an expert resale assistant. Return only JSON with keys: suggestedPrice (number, USD), sourcesSearched (array of strings), suggestedDescription (string, max 180 chars), brandDescription (string, 2-4 sentences describing the brand in this style: 'IMG is a Norwegian furniture brand known for...'), pricingReasoning (string, 1-2 sentences explaining why this price range makes sense), itemDescriptionChips (array of 3-6 short strings describing item attributes and condition), pricingChips (array of 3-6 short strings that explain price drivers like rarity, condition, brand demand, comps), title (string), brand (string). Do NOT use quantity semantics (single, pair, set, multiple pieces, lot, bundle, count) as a reason for pricing, and do NOT mention those terms in pricingReasoning or pricingChips. pricingReasoning must be complete sentences and must NOT end with ellipses.";
const CLEANING_FEE_CENTS = 15_000;
const MAX_DESCRIPTION_LENGTH = 180;
const MAX_BRAND_DESCRIPTION_LENGTH = 520;

const parseJsonFromText = (value: string): Record<string, unknown> | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    // Continue and try extracting fenced or inline JSON object.
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1]) as Record<string, unknown>;
    } catch {
      // Continue.
    }
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const slice = trimmed.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(slice) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  return null;
};

const toCents = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.round(value * 100));
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(/[$,\s]/g, ""));
    if (Number.isFinite(parsed)) return Math.max(0, Math.round(parsed * 100));
  }
  return null;
};

const toDollars = (cents: number): number => Math.round(cents) / 100;

const shortenDescription = (value: string): string => {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= MAX_DESCRIPTION_LENGTH) return normalized;
  return `${normalized.slice(0, MAX_DESCRIPTION_LENGTH - 1).trimEnd()}...`;
};

const shortenBrandDescription = (value: string): string => {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= MAX_BRAND_DESCRIPTION_LENGTH) return normalized;
  return `${normalized.slice(0, MAX_BRAND_DESCRIPTION_LENGTH - 1).trimEnd()}...`;
};

const QUANTITY_SEMANTICS_RE =
  /\b(single|pair|set|sets|multiple|pieces?|bundle|lot|count|not a set)\b/i;

const sanitizePricingReasoning = (value: string): string => {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return normalized;
  const sentences = normalized.split(/(?<=[.!?])\s+/);
  const kept = sentences.filter((sentence) => !QUANTITY_SEMANTICS_RE.test(sentence));
  const cleaned = kept.join(" ").trim();
  return cleaned || "Pricing reflects brand, condition, and comparable market demand.";
};

const normalizeChips = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.replace(/\s+/g, " ").trim())
    .filter(
      (entry, index, arr) =>
        entry.length > 0 &&
        !QUANTITY_SEMANTICS_RE.test(entry) &&
        arr.indexOf(entry) === index
    )
    .slice(0, 6);
};

const resolveOrgIdForRequest = (req: Request, auth: Awaited<ReturnType<typeof requireAuth>>) => {
  if (auth.orgId) return auth.orgId;
  const selectedOrgId = req.headers.get("X-Selected-Org-Id");
  if (process.env.NODE_ENV !== "production" && selectedOrgId?.startsWith("org_")) {
    return selectedOrgId;
  }
  return undefined;
};

const handleProductsProcess = async (req: Request) => {
  try {
    const auth = await requireAuth(req);
    const orgId = resolveOrgIdForRequest(req, auth);
    if (!orgId) {
      return Response.json({ error: "Active organization required" }, { status: 400 });
    }

    const body = (await req.json()) as ProductProcessRequest;
    const items = body.items ?? [];
    if (!Array.isArray(items) || items.length === 0) {
      return Response.json({ error: "items required" }, { status: 400 });
    }
    if (items.length > 24) {
      return Response.json({ error: "max 24 items per batch" }, { status: 400 });
    }

    const systemPrompt = DEFAULT_PRODUCT_SYSTEM_PROMPT;

    const invalid = items.find(
      (item) =>
        !item.clientId ||
        !Array.isArray(item.imageDataUrls) ||
        item.imageDataUrls.some((imageDataUrl) => !imageDataUrl.startsWith("data:image/"))
    );
    if (invalid) {
      return Response.json(
        { error: "each item requires clientId and imageDataUrls (data:image/*[])" },
        { status: 400 }
      );
    }

    const llmReq = new Request(req.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Selected-Org-Id": orgId },
      body: JSON.stringify({
        run: { default_provider: "openai" },
        agents: items.map((item, index) => ({
          id: item.clientId,
          provider: "openai",
          web_search: true,
          include_web_search_sources: true,
          order: index,
          prompt: `Analyze this product and return JSON only for clientId=${item.clientId}.`,
          input: [
            {
              role: "system",
              content: [{ type: "input_text", text: systemPrompt }],
            },
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text:
                    "Product metadata JSON:\n" +
                    JSON.stringify(
                      {
                        clientId: item.clientId,
                        model: item.model,
                        originalPrice: item.originalPrice ?? null,
                        isUsed: item.isUsed ?? null,
                        notes: item.notes ?? "",
                      },
                      null,
                      2
                    ) +
                    "\nReturn strictly valid JSON with keys: suggestedPrice, sourcesSearched, suggestedDescription, brandDescription, pricingReasoning, itemDescriptionChips, pricingChips, title, brand. pricingReasoning must be full sentences and not truncated with ellipses.",
                },
                ...item.imageDataUrls.map((imageDataUrl) => ({
                  type: "input_image" as const,
                  image_url: imageDataUrl,
                })),
              ],
            },
          ],
        })),
      }),
    });

    const llmRes = await proxyToRust(llmReq, "/api/llm/agents", { ...auth, orgId });
    const llmBody = await llmRes.text();
    const llmJson = (() => {
      if (!llmBody.trim()) return {};
      try {
        return JSON.parse(llmBody) as {
          agents?: Array<{
            id: string;
            provider: string;
            status: string;
            answer?: string | null;
            sources?: string[] | null;
            error?: string | null;
            duration_ms?: number;
          }>;
          error?: unknown;
        };
      } catch {
        return { error: llmBody };
      }
    })() as {
      agents?: Array<{
        id: string;
        provider: string;
        status: string;
        answer?: string | null;
        sources?: string[] | null;
        error?: string | null;
        duration_ms?: number;
      }>;
      error?: unknown;
    };
    if (!llmRes.ok || !Array.isArray(llmJson.agents)) {
      return Response.json(
        { error: "Failed to process products with AI", detail: llmJson.error ?? null },
        { status: llmRes.status || 502 }
      );
    }

    const itemById = new Map(items.map((item) => [item.clientId, item]));
    const perAgent = await Promise.all(
      llmJson.agents.map(async (agent) => {
        const sourceItem = itemById.get(agent.id);
        if (!sourceItem) {
          return {
            clientId: agent.id,
            status: "failed",
            error: "Unknown item returned from AI pipeline",
          };
        }
        if (agent.status !== "ok" || !agent.answer) {
          return {
            clientId: sourceItem.clientId,
            status: "failed",
            error: agent.error || "AI processing failed",
          };
        }

        const parsed = parseJsonFromText(agent.answer);
        if (!parsed) {
          return {
            clientId: sourceItem.clientId,
            status: "failed",
            error: "AI response was not valid JSON",
          };
        }

        const suggestedPriceCents =
          toCents(parsed.suggestedPrice) ??
          (sourceItem.originalPrice != null ? Math.round(sourceItem.originalPrice * 100) : 0);
        const suggestedDescriptionRaw =
          typeof parsed.suggestedDescription === "string"
            ? parsed.suggestedDescription
            : "";
        const suggestedDescription = shortenDescription(suggestedDescriptionRaw);
        const brandDescriptionRaw =
          typeof parsed.brandDescription === "string" ? parsed.brandDescription : "";
        const brandDescription = shortenBrandDescription(brandDescriptionRaw);
        const pricingReasoningRaw =
          typeof parsed.pricingReasoning === "string" ? parsed.pricingReasoning : "";
        const pricingReasoning = sanitizePricingReasoning(pricingReasoningRaw);
        const itemDescriptionChips = normalizeChips(parsed.itemDescriptionChips);
        const pricingChips = normalizeChips(parsed.pricingChips);
        const floorPriceCents = suggestedPriceCents;
        const consignorCashBuyPriceCents = Math.round(floorPriceCents * 0.5);
        const consignmentRangeLowCents = Math.max(0, Math.round(floorPriceCents * 0.8));
        const consignmentRangeHighCents = Math.round(floorPriceCents * 1.2);
        const title =
          typeof parsed.title === "string" && parsed.title.trim().length > 0
            ? parsed.title.trim()
            : sourceItem.model.trim();
        const sku = suggestListingSku(sourceItem.model, title, sourceItem.clientId);
        const brand =
          typeof parsed.brand === "string" && parsed.brand.trim().length > 0
            ? parsed.brand.trim()
            : sourceItem.model.trim().split(/\s+/)[0] ?? "";
        const providerSources = Array.isArray(agent.sources)
          ? agent.sources.filter((x): x is string => typeof x === "string")
          : [];
        const modelSources = Array.isArray(parsed.sourcesSearched)
          ? parsed.sourcesSearched.filter((x): x is string => typeof x === "string")
          : [];
        const sourcesSearched = providerSources.length > 0 ? providerSources : modelSources;
        const descriptionHtml = [suggestedDescription, brandDescription]
          .map((part) => part.trim())
          .filter(Boolean)
          .join("\n\n");

        const listingReq = new Request(req.url, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Selected-Org-Id": orgId },
          body: JSON.stringify({
            status: "draft",
            title,
            sku,
            vendor: brand,
            description_html: descriptionHtml,
            suggested_price_cents: floorPriceCents,
            price_cents: floorPriceCents,
            currency_code: "USD",
            media_urls: sourceItem.imageDataUrls,
            ai_attributes: {
              model: sourceItem.model,
              originalPrice: sourceItem.originalPrice ?? null,
              isUsed: sourceItem.isUsed ?? null,
              notes: sourceItem.notes ?? "",
              imageCount: sourceItem.imageDataUrls.length,
              cleaningFeeCents: CLEANING_FEE_CENTS,
              suggestedPriceCents,
              floorPriceCents,
              consignorCashBuyPriceCents,
              consignmentRangeLowCents,
              consignmentRangeHighCents,
              durationMs: agent.duration_ms ?? null,
              brand,
              brandDescription,
              pricingReasoning,
              itemDescriptionChips,
              pricingChips,
              sourcesSearched,
            },
            ai_quality: {
              provider: agent.provider,
              durationMs: agent.duration_ms ?? null,
              pipeline: "products_process_v1",
            },
          }),
        });

        const listingRes = await proxyToRust(listingReq, "/api/listings", { ...auth, orgId });
        const listingBody = await listingRes.json().catch(() => ({}));
        if (!listingRes.ok) {
          const isPayloadTooLarge = listingRes.status === 413;
          const rawError =
            (listingBody as { error?: { message?: string } | string }).error ?? null;
          const parsedError =
            typeof rawError === "string"
              ? rawError
              : typeof rawError?.message === "string"
                ? rawError.message
                : null;
          return {
            clientId: sourceItem.clientId,
            status: "failed",
            parsed,
            error:
              parsedError ||
              (isPayloadTooLarge
                ? "Images are too large for upload. Remove some images, or retry with fewer/lower-resolution photos."
                : "Failed to create listing"),
          };
        }

        const created = listingBody as { id?: string };
        return {
          clientId: sourceItem.clientId,
          status: "created",
          parsed: {
            durationMs: agent.duration_ms ?? undefined,
            suggestedPrice: toDollars(suggestedPriceCents),
            floorPrice: toDollars(floorPriceCents),
            consignorCashBuyPrice: toDollars(consignorCashBuyPriceCents),
            consignmentRangeLow: toDollars(consignmentRangeLowCents),
            consignmentRangeHigh: toDollars(consignmentRangeHighCents),
            suggestedDescription,
            brandDescription,
            pricingReasoning,
            itemDescriptionChips,
            pricingChips,
            title,
            sourcesSearched,
          },
          listingId: created.id ?? null,
        };
      })
    );

    return Response.json({ results: perAgent });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: 401 });
    }
    console.error("POST /api/products/process failed:", error);
    return Response.json({ error: "Failed to process products" }, { status: 500 });
  }
};

const staticRoutes = {
  "/robots.txt": handleRobotsTxt,
  "/sitemap.xml": handleSitemapXml,
  "/image/*": handleImageAsset,
};

const shieldHandler = authProxyHandler("/api/shield");
const agentActivityHandler = authProxyHandler("/api/agent-activity");
const llmAgentsHandler = authProxyHandler("/api/llm/agents");
const llmAgentsStreamHandler = authProxyHandler("/api/llm/agents/stream");

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
