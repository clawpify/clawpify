import { useState } from "react";
import { useAudit } from "../context";
import { asStringArray } from "../types";
import { VisibilityChart } from "./VisibilityChart";
import { CitationsTable } from "./CitationsTable";
import { ChatDetailView } from "./ChatDetailView";
import { TopSourcesPreview } from "./TopSourcesPreview";

const CellSkeleton = ({ className = "" }: { className?: string }) => (
  <div
    className={`h-4 rounded bg-zinc-200 animate-pulse ${className}`}
    aria-hidden
  />
);

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
  const { data, step, error, generatedCompetitors, generatedPrompts, runChatGPTSearch } =
    useAudit();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const isLoading = step === "loading";
  const searchSkipped =
    data?.results.length === 0 && data?.status === "completed";

  const showError =
    error && !error.includes("OPENAI_API_KEY not configured");

  const prompts =
    generatedPrompts.length > 0
      ? generatedPrompts
      : data?.results.map((r) => r.query) ?? [];
  const hasPrompts = prompts.length > 0;
  const rows =
    hasPrompts ? prompts : data?.results ?? [];

  return (
    <div className="space-y-6">
      {showError && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {searchSkipped && (
        <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
          {runChatGPTSearch
            ? "No citation results were returned. Please try again."
            : "ChatGPT search was skipped. Enable \"Run ChatGPT search\" and analyze again to get citation data."}
        </p>
      )}
      <>
          <VisibilityChart
            data={data}
            companyName={data?.company_name ?? ""}
            competitors={generatedCompetitors}
            isLoading={isLoading && !data?.results.length}
          />

          {!searchSkipped && (
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
                    {rows.map((promptOrResult, idx) => {
                      const query =
                        typeof promptOrResult === "string"
                          ? promptOrResult
                          : typeof promptOrResult === "object" &&
                              promptOrResult &&
                              "query" in promptOrResult
                            ? (promptOrResult as { query: string }).query
                            : "";
                      const matchingResult = data?.results.find(
                        (r) => r.query === query
                      );
                      const isLoadingRow = !matchingResult;
                      const isExpanded = expandedId === matchingResult?.id;

                      return (
                        <tr
                          key={matchingResult?.id ?? `prompt-${idx}`}
                            role="button"
                            tabIndex={0}
                            onClick={() =>
                              matchingResult &&
                              setExpandedId(isExpanded ? null : matchingResult.id)
                            }
                            onKeyDown={(e) => {
                              if (
                                (e.key === "Enter" || e.key === " ") &&
                                matchingResult
                              ) {
                                e.preventDefault();
                                setExpandedId(
                                  isExpanded ? null : matchingResult.id
                                );
                              }
                            }}
                            className={`border-b border-zinc-100 last:border-0 transition ${
                              matchingResult
                                ? "cursor-pointer hover:bg-zinc-50"
                                : ""
                            } ${isExpanded ? "bg-zinc-50" : ""}`}
                            aria-expanded={isExpanded}
                          >
                            <td className="px-4 py-3 text-zinc-400">
                              {isLoadingRow ? (
                                <CellSkeleton className="h-5 w-5" />
                              ) : (
                                <OpenAIIcon />
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-zinc-900">
                              {isLoadingRow ? (
                                <CellSkeleton className="w-20" />
                              ) : (
                                formatDate(matchingResult!.created_at)
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-zinc-900">
                              {isLoadingRow ? (
                                <CellSkeleton className="w-48 max-w-full" />
                              ) : (
                                matchingResult!.query
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {isLoadingRow ? (
                                <CellSkeleton className="w-16" />
                              ) : (
                                <TopSourcesPreview
                                  urls={asStringArray(
                                    matchingResult!.citation_urls
                                  )}
                                />
                              )}
                            </td>
                          </tr>
                        );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="flex min-w-0 flex-1 flex-col">
              <CitationsTable
                data={data}
                isLoading={isLoading && !data?.results.length}
              />
            </section>
          </div>
          )}
      </>

      {expandedId && data && (() => {
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
