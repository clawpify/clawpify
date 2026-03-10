import Firecrawl from "@mendable/firecrawl-js";

const SCRAPE_TIMEOUT_MS = 30_000;

function normalizeUrl(url: string): string {
  const u = url.trim();
  if (u.startsWith("https://") || u.startsWith("http://")) return u;
  return `https://${u}`;
}

/** Extract readable text from HTML (simple fallback when Firecrawl unavailable). */
function htmlToText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100_000);
}

/** Fetch URL via plain HTTP and extract text. Used when Firecrawl is unset or fails. */
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
