import type { CitationData } from "../types";
import { asStringArray } from "../types";

function domainFromUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

const LinkIcon = () => (
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
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

type DomainStats = {
  domain: string;
  totalCitations: number;
  promptCount: number;
  used: number;
  avgCitations: number;
};

function computeCitations(data: CitationData): DomainStats[] {
  const totalPrompts = data.results.length;
  const byDomain = new Map<string, { totalCitations: number; promptCount: number }>();

  for (const r of data.results) {
    const urls = asStringArray(r.citation_urls);
    const domainCounts = new Map<string, number>();

    for (const url of urls) {
      const domain = domainFromUrl(url);
      if (!domain) continue;
      domainCounts.set(domain, (domainCounts.get(domain) ?? 0) + 1);
    }

    for (const [domain, count] of domainCounts) {
      const existing = byDomain.get(domain);
      if (existing) {
        existing.totalCitations += count;
        existing.promptCount += 1;
      } else {
        byDomain.set(domain, { totalCitations: count, promptCount: 1 });
      }
    }
  }

  return [...byDomain.entries()]
    .map(([domain, { totalCitations, promptCount }]) => ({
      domain,
      totalCitations,
      promptCount,
      used: totalPrompts > 0 ? Math.round((promptCount / totalPrompts) * 100) : 0,
      avgCitations: promptCount > 0 ? totalCitations / promptCount : 0,
    }))
    .sort((a, b) => b.totalCitations - a.totalCitations)
    .slice(0, 15);
}

type Props = {
  data: CitationData;
};

export function CitationsTable({ data }: Props) {
  const citations = computeCitations(data);

  return (
    <section className="flex flex-1 flex-col">
      <div className="mb-4 shrink-0">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
          <LinkIcon />
          Key Sources
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Spot the citations shaping your visibility
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Domain
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Used
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Avg. Citations
              </th>
            </tr>
          </thead>
          <tbody>
            {citations.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-sm text-zinc-500">
                  No citations yet
                </td>
              </tr>
            ) : (
              citations.map((c) => {
                const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(c.domain)}&sz=32`;
                const letter = c.domain.charAt(0).toUpperCase();

                return (
                  <tr
                    key={c.domain}
                    className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50"
                  >
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2">
                        <span className="relative flex h-5 w-5 shrink-0" title={c.domain}>
                          <img
                            src={faviconUrl}
                            alt=""
                            className="h-5 w-5 rounded object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                              if (fallback) fallback.style.display = "flex";
                            }}
                          />
                          <span
                            className="absolute inset-0 flex hidden items-center justify-center rounded bg-zinc-200 text-xs font-medium text-zinc-700"
                            style={{ display: "none" }}
                          >
                            {letter}
                          </span>
                        </span>
                        <span className="text-sm font-medium text-zinc-900">
                          {c.domain}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-700">{c.used}%</td>
                    <td className="px-4 py-3 text-sm text-zinc-700">
                      {c.avgCitations.toFixed(1)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
