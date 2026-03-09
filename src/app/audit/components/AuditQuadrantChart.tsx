import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { Scatter } from "react-chartjs-2";
import type { CitationData } from "../types";
import { asStringArray } from "../types";

function normalizeDomain(url: string): string {
  const u = url.trim().toLowerCase();
  return u
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0] ?? "";
}

function computeQuadrantData(data: CitationData): {
  brandCoverage: number;
  likelihoodToBuy: number;
  totalCitationUrls: number;
  yourCitationUrls: number;
} {
  const total = data.results.length;
  const yourMentions = data.results.filter(
    (r) => r.your_product_mentioned === true
  ).length;
  const brandCoverage = total > 0 ? (yourMentions / total) * 100 : 0;

  let totalCitationUrls = 0;
  let yourCitationUrls = 0;
  const domain = normalizeDomain(data.website_url);

  for (const r of data.results) {
    const urls = asStringArray(r.citation_urls);
    totalCitationUrls += urls.length;
    for (const url of urls) {
      const u = url.toLowerCase();
      if (u.includes(domain)) yourCitationUrls++;
    }
  }

  const likelihoodToBuy =
    totalCitationUrls > 0 ? (yourCitationUrls / totalCitationUrls) * 100 : 0;

  return {
    brandCoverage,
    likelihoodToBuy,
    totalCitationUrls,
    yourCitationUrls,
  };
}

const quadrantReferenceLinesPlugin = {
  id: "quadrantReferenceLines",
  afterDraw(chart: ChartJS) {
    const { ctx, scales } = chart;
    const xScale = scales.x;
    const yScale = scales.y;
    if (!xScale || !yScale) return;

    const x50 = xScale.getPixelForValue(50);
    const y50 = yScale.getPixelForValue(50);
    const left = xScale.left;
    const right = xScale.right;
    const top = yScale.top;
    const bottom = yScale.bottom;

    ctx.save();
    ctx.strokeStyle = "#a1a1aa";
    ctx.setLineDash([2, 2]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x50, top);
    ctx.lineTo(x50, bottom);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(left, y50);
    ctx.lineTo(right, y50);
    ctx.stroke();
    ctx.restore();
  },
};

type Props = { data: CitationData; companyName: string };

export function AuditQuadrantChart({ data, companyName }: Props) {
  const { brandCoverage, likelihoodToBuy } = computeQuadrantData(data);

  const chartData = {
    datasets: [
      {
        data: [{ x: brandCoverage, y: likelihoodToBuy }],
        label: companyName,
        backgroundColor: "#18181b",
        borderColor: "#18181b",
        pointRadius: 8,
      },
    ],
  };

  const options: ChartOptions<"scatter"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: (ctx) => `${companyName}: ${(ctx.raw as { x: number; y: number }).x.toFixed(1)}% coverage, ${(ctx.raw as { x: number; y: number }).y.toFixed(1)}% likelihood`,
        },
        backgroundColor: "white",
        borderColor: "#e4e4e7",
        borderWidth: 1,
        cornerRadius: 6,
      },
    },
    scales: {
      x: {
        type: "linear",
        min: 0,
        max: 100,
        title: { display: true, text: "Brand Coverage (%)" },
        ticks: { callback: (v) => `${v}%` },
        grid: { color: "#e4e4e7" },
      },
      y: {
        type: "linear",
        min: 0,
        max: 100,
        title: { display: true, text: "Likelihood to buy (%)" },
        ticks: { callback: (v) => `${v}%` },
        grid: { color: "#e4e4e7" },
      },
    },
    plugins: [quadrantReferenceLinesPlugin],
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-zinc-900">
        See what AI is talking about your prompts
      </h2>
      <div className="h-96 w-full min-h-[400px]">
        <Scatter data={chartData} options={options} />
      </div>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-zinc-500">
        <span>Niche: high buy, low coverage</span>
        <span>Leaders: high both</span>
        <span>Low Performance: low both</span>
        <span>Low Conversion: high coverage, low buy</span>
      </div>
    </div>
  );
}
