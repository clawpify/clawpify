import * as React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Filler,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";

export type ChartDataPoint = {
  date: string;
  desktop: number;
  mobile: number;
};

export const SAMPLE_CHART_DATA: ChartDataPoint[] = [
  { date: "2024-04-01", desktop: 222, mobile: 150 },
  { date: "2024-04-08", desktop: 409, mobile: 320 },
  { date: "2024-04-16", desktop: 446, mobile: 360 },
  { date: "2024-04-24", desktop: 387, mobile: 290 },
  { date: "2024-05-01", desktop: 165, mobile: 220 },
  { date: "2024-05-08", desktop: 149, mobile: 210 },
  { date: "2024-05-15", desktop: 473, mobile: 380 },
  { date: "2024-05-22", desktop: 81, mobile: 120 },
  { date: "2024-05-30", desktop: 340, mobile: 280 },
  { date: "2024-06-01", desktop: 178, mobile: 200 },
  { date: "2024-06-10", desktop: 155, mobile: 200 },
  { date: "2024-06-20", desktop: 408, mobile: 450 },
  { date: "2024-06-30", desktop: 446, mobile: 400 },
];

type Props = {
  data: ChartDataPoint[];
  title?: string;
  description?: string;
  timeRange?: "90d" | "30d" | "7d";
  onTimeRangeChange?: (range: "90d" | "30d" | "7d") => void;
  showTimeRange?: boolean;
  emptyMessage?: string;
  emptyHint?: string;
};

function filterByTimeRange(
  data: ChartDataPoint[],
  range: "90d" | "30d" | "7d"
): ChartDataPoint[] {
  if (data.length === 0) return [];
  const days = range === "90d" ? 90 : range === "30d" ? 30 : 7;
  const lastDate = new Date(data[data.length - 1]!.date);
  const startDate = new Date(lastDate);
  startDate.setDate(startDate.getDate() - days);
  return data.filter((item) => new Date(item.date) >= startDate);
}

const TIME_LABELS: Record<"90d" | "30d" | "7d", string> = {
  "90d": "Last 3 months",
  "30d": "Last 30 days",
  "7d": "Last 7 days",
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

export function ChartAreaInteractive({
  data,
  title = "Total Visitors",
  description = "Total for the last 3 months",
  timeRange = "90d",
  onTimeRangeChange,
  showTimeRange = true,
  emptyMessage = "No data to display",
  emptyHint = "Select a time range or add data to see the chart",
}: Props) {
  const [range, setRange] = React.useState<"90d" | "30d" | "7d">(timeRange);

  const filteredData = React.useMemo(
    () => filterByTimeRange(data, range),
    [data, range]
  );

  const handleRangeChange = (r: "90d" | "30d" | "7d") => {
    setRange(r);
    onTimeRangeChange?.(r);
  };

  const isEmpty = filteredData.length === 0;

  const chartData = React.useMemo(
    () => ({
      labels: filteredData.map((d) => d.date),
      datasets: [
        {
          label: "Mobile",
          data: filteredData.map((d) => d.mobile),
          fill: true,
          tension: 0.4,
          backgroundColor: "rgba(113, 113, 122, 0.2)",
          borderColor: "#71717a",
          borderWidth: 2,
          stack: "a",
        },
        {
          label: "Desktop",
          data: filteredData.map((d) => d.desktop),
          fill: true,
          tension: 0.4,
          backgroundColor: "rgba(156, 163, 175, 0.2)",
          borderColor: "#9ca3af",
          borderWidth: 2,
          stack: "a",
        },
      ],
    }),
    [filteredData]
  );

  const options: ChartOptions<"line"> = React.useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false },
      plugins: {
        tooltip: {
          backgroundColor: "white",
          borderColor: "#e4e4e7",
          borderWidth: 1,
          cornerRadius: 8,
          boxPadding: 6,
          callbacks: {
            title: (items) =>
              items[0]?.label ? formatDate(String(items[0].label)) : "",
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 8,
            callback: (value) => {
              const point = filteredData[Number(value)];
              return point ? formatDate(point.date) : "";
            },
          },
          border: { display: false },
        },
        y: {
          grid: { color: "#e4e4e7" },
          ticks: { maxTicksLimit: 6 },
          border: { display: false },
        },
      },
    }),
    [filteredData]
  );

  return (
    <div className="rounded-lg border border-zinc-200 bg-white">
      <div className="flex flex-col gap-2 border-b border-zinc-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
          <p className="text-sm text-zinc-500">{description}</p>
        </div>
        {showTimeRange && (
          <div className="flex gap-1 rounded-lg border border-zinc-200 bg-zinc-50/50 p-1">
            {(["90d", "30d", "7d"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleRangeChange(r)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  range === r
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                {TIME_LABELS[r]}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-2 py-4 sm:px-6 sm:py-6">
        {isEmpty ? (
          <div className="flex min-h-[250px] flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-zinc-200/80">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#9ca3af"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="12" width="4" height="6" rx="1" />
                <rect x="10" y="8" width="4" height="10" rx="1" />
                <rect x="17" y="4" width="4" height="14" rx="1" />
              </svg>
            </div>
            <p className="mt-3 text-sm font-medium text-zinc-900">
              {emptyMessage}
            </p>
            <p className="mt-1 text-sm text-zinc-500">{emptyHint}</p>
          </div>
        ) : (
          <div className="h-[250px] w-full">
            <Line data={chartData} options={options} />
          </div>
        )}
      </div>

      {!isEmpty && (
        <div className="flex justify-end gap-4 border-t border-zinc-200 px-6 py-5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-400" />
            <span className="text-xs text-zinc-600">Mobile</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
            <span className="text-xs text-zinc-600">Desktop</span>
          </div>
        </div>
      )}
    </div>
  );
}
