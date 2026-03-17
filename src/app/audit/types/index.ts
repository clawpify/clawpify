import { z } from "zod";

function normalizeUrl(url: string): string {
  const s = url.trim();
  if (!s) return s;
  if (!/^https?:\/\//i.test(s)) return `https://${s}`;
  return s;
}

/** Extract domain from URL for use as company name (e.g. "https://www.shopify.com" -> "shopify.com") */
export function domainFromUrl(url: string): string {
  const s = url.trim();
  if (!s) return "";
  try {
    const u = new URL(s.startsWith("http") ? s : `https://${s}`);
    return u.hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return s.split("/")[0]?.replace(/^www\./i, "") ?? "";
  }
}

export const citationFormSchema = z.object({
  company_name: z.string().trim().optional().default(""),
  website_url: z
    .string()
    .min(1, "Domain is required")
    .transform(normalizeUrl)
    .pipe(z.string().url("Valid domain or URL is required")),
  product_description: z.string().trim(),
});

export type CitationForm = z.infer<typeof citationFormSchema>;

export const citationResultSchema = z.object({
  id: z.string(),
  citation_id: z.string(),
  query: z.string(),
  response_text: z.string().nullable(),
  citation_urls: z.unknown(),
  mentioned_brands: z.unknown(),
  your_product_mentioned: z.boolean().nullable(),
  created_at: z.string(),
});

export const citationResponseSchema = z.object({
  id: z.string(),
  company_name: z.string(),
  website_url: z.string(),
  product_description: z.string(),
  status: z.string(),
  created_at: z.string(),
  completed_at: z.string().nullable(),
  results: z.array(citationResultSchema),
});

export type CitationResult = z.infer<typeof citationResultSchema>;
export type CitationData = z.infer<typeof citationResponseSchema>;

export function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string");
  return [];
}
