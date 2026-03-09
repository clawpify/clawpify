import { useState } from "react";
import { useAudit } from "../context";
import { asStringArray } from "../types";
import { AuditQuadrantChart } from "./AuditQuadrantChart";
import { AuditRankings } from "./AuditRankings";
import { ChatDetailView } from "./ChatDetailView";

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
  const { data, reset, error } = useAudit();
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
          <AuditQuadrantChart data={data} companyName={data.company_name} />

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

          <section>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-zinc-900">
                Per-prompt breakdown
              </h2>
            </div>
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Query
                    </th>
                    <th className="w-8 px-4 py-3" aria-hidden />
                  </tr>
                </thead>
                <tbody>
                  {data.results.map((r) => {
                    const isExpanded = expandedId === r.id;
                    const dateStr = formatDate(r.created_at);

                    return (
                      <tr
                        key={r.id}
                        className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition"
                      >
                        <td className="px-4 py-3 text-sm text-zinc-900">
                          {dateStr}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-900">
                          {r.query}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? null : r.id)}
                            className="flex h-8 w-8 items-center justify-center rounded text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 transition"
                            aria-expanded={isExpanded}
                          >
                            {isExpanded ? "−" : "+"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <AuditRankings data={data} />
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

      <div className="flex justify-end gap-2 pt-4">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Run another
        </button>
      </div>
    </div>
  );
}
