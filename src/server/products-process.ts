import { suggestListingSku } from "../app/app/modules/products/utils/suggestListingSku";
import { requireAuth, AuthError } from "../lib/auth";
import { messageFromErrorBody } from "../lib/messageFromErrorBody";
import { proxyToRust } from "../utils/networkFns";

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

function parseJsonFromText(value: string): Record<string, unknown> | null {
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
}

function toCents(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.round(value * 100));
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(/[$,\s]/g, ""));
    if (Number.isFinite(parsed)) return Math.max(0, Math.round(parsed * 100));
  }
  return null;
}

function toDollars(cents: number): number {
  return Math.round(cents) / 100;
}

function shortenDescription(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= MAX_DESCRIPTION_LENGTH) return normalized;
  return `${normalized.slice(0, MAX_DESCRIPTION_LENGTH - 1).trimEnd()}...`;
}

function shortenBrandDescription(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= MAX_BRAND_DESCRIPTION_LENGTH) return normalized;
  return `${normalized.slice(0, MAX_BRAND_DESCRIPTION_LENGTH - 1).trimEnd()}...`;
}

const QUANTITY_SEMANTICS_RE =
  /\b(single|pair|set|sets|multiple|pieces?|bundle|lot|count|not a set)\b/i;

function sanitizePricingReasoning(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return normalized;
  const sentences = normalized.split(/(?<=[.!?])\s+/);
  const kept = sentences.filter((sentence) => !QUANTITY_SEMANTICS_RE.test(sentence));
  const cleaned = kept.join(" ").trim();
  return cleaned || "Pricing reflects brand, condition, and comparable market demand.";
}

function normalizeChips(value: unknown): string[] {
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
}

function resolveOrgIdForRequest(
  req: Request,
  auth: Awaited<ReturnType<typeof requireAuth>>
) {
  if (auth.orgId) return auth.orgId;
  const selectedOrgId = req.headers.get("X-Selected-Org-Id");
  if (process.env.NODE_ENV !== "production" && selectedOrgId?.startsWith("org_")) {
    return selectedOrgId;
  }
  return undefined;
}

export async function handleProductsProcess(req: Request) {
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
    })();
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
          const parsedError = messageFromErrorBody(listingBody);
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
}
