import Firecrawl from "@mendable/firecrawl-js";

const SCRAPE_TIMEOUT_MS = 30_000;

/**
 * Normalize a URL by ensuring it has an https:// scheme.
 *
 * @param url - The raw URL string to normalize.
 * @returns The URL with a leading https:// scheme if none was present.
 */
function normalizeUrl(url: string): string {
  const u = url.trim();
  if (u.startsWith("https://") || u.startsWith("http://")) return u;
  return `https://${u}`;
}

/**
 * Extract readable text from an HTML string.
 * Strips script/style tags and collapses whitespace.
 * Used as a simple fallback when Firecrawl is unavailable.
 *
 * @param html - Raw HTML string to parse.
 * @returns Plain text content, truncated to 100,000 characters.
 */
function htmlToText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100_000);
}

/**
 * Fetch a URL via plain HTTP and extract its text content.
 * Used when Firecrawl is unset or fails.
 *
 * @param url - The normalized URL to fetch.
 * @returns Extracted text content, or null if the request failed or yielded too little content.
 */
async function fetchWithHttpFallback(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(SCRAPE_TIMEOUT_MS),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Clawpify/1.0; +https://github.com/clawpify)",
      },
    });

    if (!res.ok) return null;

    const html = await res.text();
    const text = htmlToText(html);

    return text.length > 50 ? text : null;
  } catch {
    return null;
  }
}

/**
 * Scrape readable content from a URL using Firecrawl when available,
 * falling back to a plain HTTP fetch.
 *
 * @param url - The URL to scrape.
 * @returns Markdown or plain text content from the page, or null if scraping failed.
 */
export async function scrapeUrlForContent(url: string): Promise<string | null> {
  const normalized = normalizeUrl(url);
  const apiKey = process.env.FIRECRAWL_API_KEY?.trim();

  if (apiKey) {
    try {
      const firecrawl = new Firecrawl({ apiKey });
      const doc = await firecrawl.scrape(normalized, { formats: ["markdown"] });

      if (doc.markdown?.trim()) return doc.markdown;
    } catch {
      // Fall through to HTTP fallback
    }
  }

  return fetchWithHttpFallback(normalized);
}
