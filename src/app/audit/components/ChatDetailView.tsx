import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { LinkIcon } from "../../../icons/audit-icons";
import type { CitationResult } from "../types";
import { asStringArray } from "../types";

const XIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const KNOWN_PLATFORMS: Record<string, string> = {
  "wordpress.org": "WordPress",
  "shopify.com": "Shopify",
  "woocommerce.com": "WooCommerce",
  "magento.com": "Magento",
  "bigcommerce.com": "BigCommerce",
  "squarespace.com": "Squarespace",
  "wix.com": "Wix",
};

function domainFromUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function platformFromDomain(domain: string): string | null {
  const d = domain.toLowerCase();
  for (const [key, label] of Object.entries(KNOWN_PLATFORMS)) {
    if (d === key || d.endsWith(`.${key}`)) return label;
  }
  return null;
}

function titleFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/$/, "").split("/").pop() ?? "";
    return path ? decodeURIComponent(path).slice(0, 40) + "..." : u.hostname;
  } catch {
    return url.slice(0, 50) + (url.length > 50 ? "..." : "");
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeResponseText(text: string): string {
  let out = text
    .replace(/\btirn0news\b/gi, "turn0news")
    .replace(/[\uE000-\uF8FF]/g, "");
  return out.replace(/\n{3,}/g, "\n\n").trim();
}

function replaceCitationsWithTags(text: string, urls: string[]): string {
  const tagClass =
    "inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-xs font-medium text-zinc-700";
  return text.replace(
    /(citeturn\d+(?:search|academia|news)\d*(?:turn\d+(?:search|academia|news)\d*)*)/gi,
    (match) => {
      const labels: string[] = [];
      const re = /(?:cite)?turn\d+(search|academia|news)(\d*)/gi;
      let m;
      while ((m = re.exec(match)) !== null) {
        const type = m[1]!.charAt(0).toUpperCase() + m[1]!.slice(1);
        const num = m[2] || "";
        labels.push(`${type} ${num}`.trim());
      }
      if (labels.length === 0) return "";
      return labels
        .map((l, i) => {
          const url = urls[i];
          const domain = url ? domainFromUrl(url) : "";
          const faviconUrl = domain
            ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`
            : "";
          const faviconHtml = faviconUrl
            ? `<img src="${escapeHtml(faviconUrl)}" alt="" class="h-3 w-3 shrink-0 object-contain" />`
            : "";
          return `<span class="${tagClass}">${faviconHtml}${escapeHtml(l)}</span>`;
        })
        .join(" ");
    }
  );
}

type Props = {
  result: CitationResult;
  companyName?: string;
  onClose: () => void;
};

export function ChatDetailView({ result, onClose }: Props) {
  const [showAllSources, setShowAllSources] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    console.log("[ChatDetailView] citation_urls:", result.citation_urls);
    console.log("[ChatDetailView] query:", result.query);
  }, [result.citation_urls, result.query]);

  const urls = asStringArray(result.citation_urls);
  const brands = asStringArray(result.mentioned_brands);
  const displaySources = showAllSources ? urls : urls.slice(0, 5);
  const hasMore = !showAllSources && urls.length > 5;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-1 flex-col overflow-hidden sm:flex-row">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  Search query
                </p>
                <div className="mt-2 rounded-lg bg-gray-100 px-4 py-3">
                  <p className="font-sans text-sm text-gray-800">
                    {result.query}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  AI output
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  AI&apos;s response to this prompt
                </p>
                <div className="mt-2">
                  {result.response_text ? (
                    <div className="font-sans text-sm leading-relaxed text-gray-900 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:my-2 [&_ol]:my-2 [&_ul]:pl-5 [&_ol]:pl-5 [&_li]:my-0.5 [&_strong]:font-semibold [&_p]:my-2 [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-semibold [&_h1]:mt-4 [&_h2]:mt-3 [&_h3]:mt-2 [&_table]:my-4 [&_table]:min-w-full [&_table]:border-collapse [&_th]:border [&_th]:border-gray-200 [&_th]:bg-gray-50 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-xs [&_th]:font-medium [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-gray-600 [&_td]:border [&_td]:border-gray-200 [&_td]:px-3 [&_td]:py-2 [&_td]:text-sm [&_td]:align-top [&_td]:break-words [&_thead]:bg-gray-50">
                      <div className="overflow-x-auto">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeRaw]}
                        >
                          {replaceCitationsWithTags(
                            sanitizeResponseText(result.response_text),
                            urls
                          )}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ) : (
                    <p className="font-sans text-sm text-gray-500">
                      No response
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <aside className="flex min-h-0 w-full flex-col overflow-hidden border-t border-gray-200 bg-gray-50 sm:w-80 sm:border-l sm:border-t-0">
            <div className="shrink-0 flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <h3 className="font-sans text-sm font-semibold text-gray-900">
                Details
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                aria-label="Close"
              >
                <XIcon />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
              <div>
                <p className="mb-2 font-sans text-xs font-medium uppercase tracking-wider text-gray-500">
                  Search query
                </p>
                <p className="font-sans text-sm font-medium text-gray-900">
                  {result.query}
                </p>
              </div>
              <div>
                <p className="mb-2 font-sans text-xs font-medium uppercase tracking-wider text-gray-500">
                  Brands
                </p>
                <p className="font-sans text-sm text-gray-700">
                  {brands.length > 0 ? brands.join(", ") : "No brands"}
                </p>
              </div>
              <div>
                <p className="mb-2 font-sans text-xs font-medium uppercase tracking-wider text-gray-500">
                  Fanout queries
                </p>
                <p className="font-sans text-sm text-gray-500">
                  No Fanout queries
                </p>
              </div>
              <div>
                <p className="mb-2 font-sans text-xs font-medium uppercase tracking-wider text-gray-500">
                  Sources consulted
                </p>
                {urls.length === 0 ? (
                  <p className="font-sans text-sm text-gray-500">
                    No sources returned. The model may not have included
                    citations for this query.
                  </p>
                ) : (
                  <>
                    <ul className="space-y-2">
                      {displaySources.map((url) => {
                        const domain = domainFromUrl(url);
                        const platform = platformFromDomain(domain);
                        const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;
                        return (
                          <li key={url} className="flex items-start gap-2">
                            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded bg-gray-100">
                              <img
                                src={faviconUrl}
                                alt=""
                                className="h-4 w-4 object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                                  if (fallback) fallback.style.display = "flex";
                                }}
                              />
                              <span className="hidden h-4 w-4 items-center justify-center" style={{ display: "none" }}>
                                <LinkIcon />
                              </span>
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-sans text-sm text-blue-600 hover:underline"
                                >
                                  {titleFromUrl(url)}
                                </a>
                                {platform && (
                                  <span className="rounded bg-gray-200 px-1.5 py-0.5 font-sans text-xs text-gray-600">
                                    ({platform})
                                  </span>
                                )}
                              </div>
                              <p className="font-sans text-xs text-gray-500">
                                {domain}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                    {hasMore && (
                      <button
                        type="button"
                        onClick={() => setShowAllSources(true)}
                        className="mt-2 font-sans text-sm text-blue-600 hover:underline"
                      >
                        View all {urls.length} sources...
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
