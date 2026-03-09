import type { CitationData } from "../types";
import { asStringArray } from "../types";

const BarChartIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-zinc-600"
  >
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);

type BrandRank = {
  brand: string;
  visibility: number;
  sov: number;
  sentiment: string;
  position: string;
  promptCount: number;
};

function computeRankings(data: CitationData): BrandRank[] {
  const totalPrompts = data.results.length;
  const brandCounts = new Map<string, number>();

  for (const r of data.results) {
    const brands = new Set(
      asStringArray(r.mentioned_brands)
        .map((b) => b.trim())
        .filter(Boolean)
    );
    if (r.your_product_mentioned) {
      const company = data.company_name.trim();
      if (company) brands.add(company);
    }
    for (const brand of brands) {
      brandCounts.set(brand, (brandCounts.get(brand) ?? 0) + 1);
    }
  }

  const totalMentions = [...brandCounts.values()].reduce((a, b) => a + b, 0);

  const TOP_N = 5;
  return [...brandCounts.entries()]
    .map(([brand, promptCount]) => ({
      brand,
      visibility:
        totalPrompts > 0 ? Math.round((promptCount / totalPrompts) * 100) : 0,
      sov:
        totalMentions > 0
          ? Math.round((promptCount / totalMentions) * 100)
          : 0,
      sentiment: "—",
      position: "—",
      promptCount,
    }))
    .sort((a, b) => b.promptCount - a.promptCount)
    .slice(0, TOP_N);
}

type Props = {
  data: CitationData;
};

export function AuditRankings({ data }: Props) {
  const rankings = computeRankings(data);

  return (
    <section>
      <div className="mb-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
          <BarChartIcon />
          Rankings
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Top brands across LLMs for your prompts
        </p>
      </div>
      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Brand
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Visibility
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                SOV
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Sentiment
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Position
              </th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((r, i) => (
              <tr
                key={r.brand}
                className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50"
              >
                <td className="px-4 py-3 text-sm text-zinc-900">{i + 1}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-sm font-medium text-zinc-700">
                      {r.brand.charAt(0).toUpperCase()}
                    </span>
                    <span className="text-sm font-medium text-zinc-900">
                      {r.brand}
                    </span>
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-zinc-700">
                  {r.visibility}%
                </td>
                <td className="px-4 py-3 text-sm text-zinc-700">{r.sov}%</td>
                <td className="px-4 py-3 text-sm text-zinc-500">
                  {r.sentiment}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-500">
                  {r.position}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
