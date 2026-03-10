import Firecrawl from "@mendable/firecrawl-js";

function normalizeUrl(url: string): string {
  const u = url.trim();
  if (u.startsWith("https://") || u.startsWith("http://")) return u;
  return `https://${u}`;
}

export async function scrapeUrlForContent(url: string): Promise<string | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey?.trim()) return null;
  try {
    const firecrawl = new Firecrawl({ apiKey });
    const normalized = normalizeUrl(url);
    const doc = await firecrawl.scrape(normalized, { formats: ["markdown"] });
    return doc.markdown ?? null;
  } catch {
    return null;
  }
}
