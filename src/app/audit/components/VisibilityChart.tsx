import { useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Filler,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { CitationData, CitationResult } from "../types";
import { asStringArray } from "../types";
import { BrandFavicon } from "./BrandFavicon";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Filler,
  Tooltip,
  Legend
);

type TimeRange = "D" | "W" | "M";

const YOUR_BRAND_COLOR = "#2563eb";
const COMPETITOR_COLOR = "#71717a";

function isYourBrand(brand: string, companyName: string): boolean {
  return brand.trim().toLowerCase() === companyName.trim().toLowerCase();
}

function resultMentionsBrand(
  result: CitationResult,
  brand: string,
  companyName: string
): boolean {
  const brandLower = brand.trim().toLowerCase();
  const companyLower = companyName.trim().toLowerCase();
  const text = (result.response_text ?? "").toLowerCase();

  if (brandLower === companyLower) {
    return result.your_product_mentioned === true || text.includes(brandLower);
  }
  return text.includes(brandLower);
}

function formatDateShort(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}

function getDateKey(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function filterByTimeRange(
  results: CitationResult[],
  range: TimeRange
): CitationResult[] {
  if (results.length === 0) return [];
  const now = new Date();
  let cutoff: Date;
  if (range === "D") {
    cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 1);
  } else if (range === "W") {
    cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 7);
  } else {
    cutoff = new Date(now);
    cutoff.setMonth(cutoff.getMonth() - 1);
  }
  return results.filter((r) => new Date(r.created_at) >= cutoff);
}

function getChartEntities(
  companyName: string,
  competitors?: string[]
): string[] {
  const hasCompetitors =
    competitors && competitors.length > 0 && competitors.some((c) => c.trim());
  if (hasCompetitors) {
    const entities: string[] = [];
    if (companyName.trim()) entities.push(companyName.trim());
    for (const c of competitors!) {
      if (c.trim()) entities.push(c.trim());
    }
    return entities;
  }
  return [];
}

function aggregateVisibilityByDate(
  results: CitationResult[],
  companyName: string,
  competitors?: string[]
): { dates: string[]; brandToValues: Map<string, number[]> } {
  const byDate = new Map<
    string,
    { total: number; brands: Map<string, number> }
  >();

  const chartEntities = getChartEntities(companyName, competitors);
  const useEntitySet = chartEntities.length > 0;

  for (const r of results) {
    const dateKey = getDateKey(r.created_at);
    if (!dateKey) continue;

    if (!byDate.has(dateKey)) {
      byDate.set(dateKey, { total: 0, brands: new Map() });
    }
    const entry = byDate.get(dateKey)!;
    entry.total += 1;

    if (useEntitySet) {
      for (const brand of chartEntities) {
        if (resultMentionsBrand(r, brand, companyName)) {
          entry.brands.set(brand, (entry.brands.get(brand) ?? 0) + 1);
        }
      }
    } else {
      const brands = new Set(
        asStringArray(r.mentioned_brands)
          .map((b) => b.trim())
          .filter(Boolean)
      );
      if (r.your_product_mentioned && companyName.trim()) {
        brands.add(companyName.trim());
      }
      for (const brand of brands) {
        entry.brands.set(brand, (entry.brands.get(brand) ?? 0) + 1);
      }
    }
  }

  const sortedDateKeys = [...byDate.keys()].sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );
  const labels = sortedDateKeys.map((d) => formatDateShort(d));

  const brandList = useEntitySet
    ? chartEntities
    : [...new Set([...byDate.values()].flatMap((e) => [...e.brands.keys()]))].sort();

  const brandToValues = new Map<string, number[]>();
  for (const brand of brandList) {
    const values = sortedDateKeys.map((d) => {
      const entry = byDate.get(d)!;
      const count = entry.brands.get(brand) ?? 0;
      return entry.total > 0 ? Math.round((count / entry.total) * 100) : 0;
    });
    brandToValues.set(brand, values);
  }

  return { dates: labels, brandToValues };
}

function aggregateVisibilitySnapshot(
  results: CitationResult[],
  companyName: string,
  competitors?: string[]
): { brand: string; visibility: number }[] {
  const totalPrompts = results.length;
  const brandCounts = new Map<string, number>();

  const chartEntities = getChartEntities(companyName, competitors);
  const useEntitySet = chartEntities.length > 0;

  if (useEntitySet) {
    for (const brand of chartEntities) {
      brandCounts.set(brand, 0);
    }
    for (const r of results) {
      for (const brand of chartEntities) {
        if (resultMentionsBrand(r, brand, companyName)) {
          brandCounts.set(brand, (brandCounts.get(brand) ?? 0) + 1);
        }
      }
    }
  } else {
    for (const r of results) {
      const brands = new Set(
        asStringArray(r.mentioned_brands)
          .map((b) => b.trim())
          .filter(Boolean)
      );
      if (r.your_product_mentioned && companyName.trim()) {
        brands.add(companyName.trim());
      }
      for (const brand of brands) {
        brandCounts.set(brand, (brandCounts.get(brand) ?? 0) + 1);
      }
    }
  }

  const entries = [...brandCounts.entries()]
    .map(([brand, count]) => ({
      brand,
      visibility:
        totalPrompts > 0 ? Math.round((count / totalPrompts) * 100) : 0,
    }))
    .sort((a, b) => {
      const aYours = isYourBrand(a.brand, companyName);
      const bYours = isYourBrand(b.brand, companyName);
      if (aYours && !bYours) return -1;
      if (!aYours && bYours) return 1;
      return b.visibility - a.visibility;
    });
  return useEntitySet ? entries : entries.slice(0, 8);
}

const LineChartIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="22 12 18 22 12 18 2 22" />
    <polyline points="22 2 12 12 2 8" />
  </svg>
);

const BarChartIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);

const ExportIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

type Props = {
  data: CitationData;
  companyName: string;
  competitors?: string[];
};

export function VisibilityChart({ data, companyName, competitors }: Props) {
  const [chartType, setChartType] = useState<"line" | "bar">("line");

  const filteredResults = useMemo(
    () => filterByTimeRange(data.results, "W"),
    [data.results]
  );

  const lineData = useMemo(
    () => aggregateVisibilityByDate(filteredResults, companyName, competitors),
    [filteredResults, companyName, competitors]
  );

  const barData = useMemo(
    () =>
      aggregateVisibilitySnapshot(filteredResults, companyName, competitors),
    [filteredResults, companyName, competitors]
  );

  const dayCount = useMemo(() => {
    const dates = new Set(
      filteredResults.map((r) => getDateKey(r.created_at)).filter(Boolean)
    );
    return dates.size;
  }, [filteredResults]);

  const hasMultiDay = lineData.dates.length > 1;
  const effectiveChartType = hasMultiDay ? chartType : "bar";

  const lineChartData = useMemo(() => {
    const hasEntitySet =
      competitors && competitors.length > 0 && competitors.some((c) => c.trim());
    const brands = [...lineData.brandToValues.keys()]
      .sort((a, b) => {
        const aYours = isYourBrand(a, companyName);
        const bYours = isYourBrand(b, companyName);
        if (aYours && !bYours) return -1;
        if (!aYours && bYours) return 1;
        return a.localeCompare(b);
      });
    const limitedBrands = hasEntitySet ? brands : brands.slice(0, 8);
    return {
      labels: lineData.dates,
      datasets: limitedBrands.map((brand) => {
        const isYours = isYourBrand(brand, companyName);
        const color = isYours ? YOUR_BRAND_COLOR : COMPETITOR_COLOR;
        return {
          label: isYours ? `${brand} (You)` : brand,
          data: lineData.brandToValues.get(brand) ?? [],
          borderColor: color,
          backgroundColor: `${color}20`,
          fill: true,
          tension: 0.3,
          pointRadius: 4,
        };
      }),
    };
  }, [lineData, companyName, competitors]);

  const lineOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top",
        labels: { boxWidth: 12, font: { size: 11 } },
      },
      tooltip: {
        callbacks: {
          title: (items) =>
            items[0]?.label ? `Date: ${items[0].label}` : "Visibility",
          label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}%`,
        },
        backgroundColor: "white",
        borderColor: "#e4e4e7",
        borderWidth: 1,
        cornerRadius: 6,
      },
    },
    scales: {
      x: {
        grid: { color: "#e4e4e7" },
        ticks: { font: { size: 11 }, maxRotation: 30 },
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: "#e4e4e7" },
        ticks: {
          callback: (v) => `${v}%`,
          font: { size: 11 },
        },
      },
    },
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">
            Visibility · Percentage of chats mentioning each brand
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Showing data for {dayCount} day{dayCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-zinc-200 bg-zinc-50 p-0.5">
            <button
              type="button"
              onClick={() => setChartType("line")}
              title="Line chart"
              className={`rounded p-1.5 transition ${
                chartType === "line"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              <LineChartIcon />
            </button>
            <button
              type="button"
              onClick={() => setChartType("bar")}
              title="Bar chart"
              className={`rounded p-1.5 transition ${
                chartType === "bar"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              <BarChartIcon />
            </button>
          </div>
          <button
            type="button"
            className="rounded-md border border-zinc-200 bg-zinc-50 p-1.5 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
            title="Export"
          >
            <ExportIcon />
          </button>
        </div>
      </div>
      <div className="h-96 w-full min-h-[320px]">
        {effectiveChartType === "line" && lineData.dates.length > 0 ? (
          <Line data={lineChartData} options={lineOptions} />
        ) : (
          <div className="flex flex-col justify-center gap-3 py-4">
            {barData.map((r) => (
              <div
                key={r.brand}
                className="relative flex items-center gap-3"
              >
                <div className="flex w-44 shrink-0 items-center gap-2">
                  <BrandFavicon brand={r.brand} />
                  <span className="truncate text-sm font-medium text-zinc-900">
                    {isYourBrand(r.brand, companyName)
                      ? `${r.brand} (You)`
                      : r.brand}
                  </span>
                </div>
                <div className="group/bar relative flex-1 min-w-0">
                  <div className="relative h-7 rounded bg-zinc-100 overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded transition-all"
                      style={{
                        width: `${r.visibility}%`,
                        backgroundColor: isYourBrand(r.brand, companyName)
                          ? YOUR_BRAND_COLOR
                          : COMPETITOR_COLOR,
                      }}
                    />
                  </div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/bar:flex flex-col items-center z-10">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-zinc-200 shadow-lg whitespace-nowrap">
                      <BrandFavicon brand={r.brand} />
                      <span className="text-sm font-semibold text-zinc-900">
                        {r.visibility}%
                      </span>
                    </div>
                    <div
                      className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-white -mt-px"
                      aria-hidden
                    />
                  </div>
                </div>
                <span className="w-10 shrink-0 text-right text-sm text-zinc-600">
                  {r.visibility}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
