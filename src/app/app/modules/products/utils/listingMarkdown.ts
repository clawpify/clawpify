import DOMPurify from "dompurify";
import { marked } from "marked";
import TurndownService from "turndown";

const turndown = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-",
});

/**
 * Normalize stored HTML into Markdown for the listing detail editor (best-effort round-trip).
 */
export function htmlToMarkdown(html: string): string {
  const h = html?.trim() ?? "";
  if (!h) return "";
  return turndown.turndown(h);
}

/**
 * Parse Markdown and return sanitized HTML safe for `description_html`.
 */
export function markdownToSafeHtml(markdown: string): string {
  const raw = marked.parse(markdown.trim() || "", { async: false }) as string;
  return DOMPurify.sanitize(raw);
}
