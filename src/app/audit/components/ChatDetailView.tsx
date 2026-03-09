import { useEffect, useState } from "react";
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

function domainFromUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
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
                  Direct answer
                </p>
                <div className="mt-2">
                  {result.response_text ? (
                    <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-900">
                      {result.response_text}
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

          <aside className="w-full border-t border-gray-200 bg-gray-50 sm:w-80 sm:border-l sm:border-t-0">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
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
            <div className="space-y-4 p-4">
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
                      {displaySources.map((url) => (
                        <li key={url}>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block font-sans text-sm text-blue-600 hover:underline"
                          >
                            {titleFromUrl(url)}
                          </a>
                          <p className="font-sans text-xs text-gray-500">
                            {domainFromUrl(url)}
                          </p>
                        </li>
                      ))}
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
