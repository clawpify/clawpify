import { useState } from "react";
import { useAudit } from "../context";
import { asStringArray } from "../types";
import { VisibilityChart } from "./VisibilityChart";
import { CitationsTable } from "./CitationsTable";
import { ChatDetailView } from "./ChatDetailView";
import { TopSourcesPreview } from "./TopSourcesPreview";

const OpenAIIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 16 16"
    fill="currentColor"
    className="opacity-50"
    aria-hidden
  >
    <path d="M14.949 6.547a3.94 3.94 0 0 0-.348-3.273 4.11 4.11 0 0 0-4.4-1.934A4.1 4.1 0 0 0 8.423.2 4.15 4.15 0 0 0 6.305.086a4.1 4.1 0 0 0-1.891.948 4.04 4.04 0 0 0-1.158 1.753 4.1 4.1 0 0 0-1.563.679A4 4 0 0 0 .554 4.72a3.99 3.99 0 0 0 .502 4.731 3.94 3.94 0 0 0 .346 3.274 4.11 4.11 0 0 0 4.402 1.933c.382.425.852.764 1.377.995.526.231 1.095.35 1.67.346 1.78.002 3.358-1.132 3.901-2.804a4.1 4.1 0 0 0 1.563-.68 4 4 0 0 0 1.14-1.253 3.99 3.99 0 0 0-.506-4.716m-6.097 8.406a3.05 3.05 0 0 1-1.945-.694l.096-.054 3.23-1.838a.53.53 0 0 0 .265-.455v-4.49l1.366.778q.02.011.025.035v3.722c-.003 1.653-1.361 2.992-3.037 2.996m-6.53-2.75a2.95 2.95 0 0 1-.36-2.01l.095.057L5.29 12.09a.53.53 0 0 0 .527 0l3.949-2.246v1.555a.05.05 0 0 1-.022.041L6.473 13.3c-1.454.826-3.311.335-4.15-1.098m-.85-6.94A3.02 3.02 0 0 1 3.07 3.949v3.785a.51.51 0 0 0 .262.451l3.93 2.237-1.366.779a.05.05 0 0 1-.048 0L2.585 9.342a2.98 2.98 0 0 1-1.113-4.094zm11.216 2.571L8.747 5.576l1.362-.776a.05.05 0 0 1 .048 0l3.265 1.86a3 3 0 0 1 1.173 1.207 2.96 2.96 0 0 1-.27 3.2 3.05 3.05 0 0 1-1.36.997V8.279a.52.52 0 0 0-.276-.445m1.36-2.015-.097-.057-3.226-1.855a.53.53 0 0 0-.53 0L6.249 6.153V4.598a.04.04 0 0 1 .019-.04L9.533 2.7a3.07 3.07 0 0 1 3.257.139c.474.325.843.778 1.066 1.303.223.526.289 1.103.191 1.664zM5.503 8.575 4.139 7.8a.05.05 0 0 1-.026-.037V4.049c0-.57.166-1.127.476-1.607s.752-.864 1.275-1.105a3.08 3.08 0 0 1 3.234.41l-.096.054-3.23 1.838a.53.53 0 0 0-.265.455zm.742-1.577 1.758-1 1.762 1v2l-1.755 1-1.762-1z" />
  </svg>
);

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export function AuditResults() {
  const { data, error, generatedCompetitors } = useAudit();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!data) return null;

  const searchSkipped = data.results.length === 0 && data.status === "completed";
  const yourMentions = data.results.filter(
    (r) => r.your_product_mentioned === true
  ).length;
  const totalPrompts = data.results.length;
  const allBrands = new Set<string>();
  for (const r of data.results) {
    for (const b of asStringArray(r.mentioned_brands)) {
      if (b.trim()) allBrands.add(b.trim());
    }
  }
  const competitorCount = allBrands.size;

  const showError =
    error && !error.includes("OPENAI_API_KEY not configured");

  return (
    <div className="space-y-6">
      {showError && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {searchSkipped && (
        <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
          ChatGPT search was skipped. Prompts and competitors are available in
          the form for manual analysis.
        </p>
      )}
      {!searchSkipped && (
        <>
          <VisibilityChart
            data={data}
            companyName={data.company_name}
            competitors={generatedCompetitors}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-2xl font-semibold text-zinc-900">{yourMentions}</p>
              <p className="text-sm text-zinc-600">Your mentions</p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-2xl font-semibold text-zinc-900">
                {competitorCount}
              </p>
              <p className="text-sm text-zinc-600">Competitors</p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-2xl font-semibold text-zinc-900">
                {yourMentions}/{totalPrompts}
              </p>
              <p className="text-sm text-zinc-600">Prompts good for your website</p>
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
            <section className="flex min-w-0 flex-1 flex-col">
              <div className="mb-4 shrink-0">
                <h2 className="text-lg font-semibold text-zinc-900">
                  Per-prompt breakdown
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Expand to view details
                </p>
              </div>
              <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-zinc-200 bg-white">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50">
                      <th className="w-10 px-4 py-3" aria-hidden>
                        <OpenAIIcon />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                        Query
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                        Sources
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.results.map((r) => {
                      const isExpanded = expandedId === r.id;
                      const dateStr = formatDate(r.created_at);

                      return (
                        <tr
                          key={r.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => setExpandedId(isExpanded ? null : r.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setExpandedId(isExpanded ? null : r.id);
                            }
                          }}
                          className="cursor-pointer border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition"
                          aria-expanded={isExpanded}
                        >
                          <td className="px-4 py-3 text-zinc-400">
                            <OpenAIIcon />
                          </td>
                          <td className="px-4 py-3 text-sm text-zinc-900">
                            {dateStr}
                          </td>
                          <td className="px-4 py-3 text-sm text-zinc-900">
                            {r.query}
                          </td>
                          <td className="px-4 py-3">
                            <TopSourcesPreview urls={asStringArray(r.citation_urls)} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="flex min-w-0 flex-1 flex-col">
              <CitationsTable data={data} />
            </section>
          </div>
        </>
      )}

      {!searchSkipped && expandedId && (() => {
        const result = data.results.find((r) => r.id === expandedId);
        return result ? (
          <ChatDetailView
            result={result}
            onClose={() => setExpandedId(null)}
          />
        ) : null;
      })()}

    </div>
  );
}
