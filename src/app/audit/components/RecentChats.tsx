import { useState } from "react";
import type { CitationData, CitationResult } from "../types";
import { asStringArray } from "../types";
import { ChatDetailView } from "./ChatDetailView";

const WebSearchIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="shrink-0 text-zinc-500"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

function formatTimeAgo(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHr = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMin = Math.floor(diffMs / (1000 * 60));
    if (diffHr >= 1) return `${diffHr} hr. ago`;
    if (diffMin >= 1) return `${diffMin} min. ago`;
    return "Just now";
  } catch {
    return "";
  }
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max).trim() + "...";
}

type Props = {
  data: CitationData;
};

export function RecentChats({ data }: Props) {
  const [filterMentioned, setFilterMentioned] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const results = filterMentioned
    ? data.results.filter((r) => r.your_product_mentioned === true)
    : data.results;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Recent Chats</h2>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={filterMentioned}
            onChange={(e) => setFilterMentioned(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-600">
            {data.company_name} mentioned
          </span>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((r) => (
          <RecentChatCard
            key={r.id}
            result={r}
            isExpanded={expandedId === r.id}
            onExpand={() => setExpandedId(expandedId === r.id ? null : r.id)}
          />
        ))}
      </div>

      {expandedId && (
        <ChatDetailView
          result={results.find((r) => r.id === expandedId)!}
          onClose={() => setExpandedId(null)}
        />
      )}
    </section>
  );
}

type CardProps = {
  result: CitationResult;
  isExpanded: boolean;
  onExpand: () => void;
};

function RecentChatCard({ result, isExpanded, onExpand }: CardProps) {
  const urls = asStringArray(result.citation_urls);
  const timeAgo = formatTimeAgo(result.created_at);

  return (
    <button
      type="button"
      onClick={onExpand}
      className={`flex flex-col items-start rounded-lg border bg-white p-4 text-left shadow-sm transition hover:border-gray-300 hover:shadow ${
        isExpanded ? "border-blue-400 ring-1 ring-blue-400" : "border-gray-200"
      }`}
    >
      <div className="flex w-full items-start gap-3">
        <WebSearchIcon />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-900">
            {truncate(result.query, 50)}
          </p>
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">
            {result.response_text
              ? truncate(result.response_text, 80)
              : "No response"}
          </p>
        </div>
      </div>
      <div className="mt-3 flex w-full items-center justify-between">
        <div className="flex gap-1">
          {urls.slice(0, 5).map((_, i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-blue-500"
              title={`${urls.length} citation(s)`}
            />
          ))}
          {urls.length > 5 && (
            <span className="text-xs text-gray-400">+{urls.length - 5}</span>
          )}
        </div>
        <span className="text-xs text-gray-400">{timeAgo}</span>
      </div>
    </button>
  );
}
