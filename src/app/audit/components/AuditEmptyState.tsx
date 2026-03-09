import { ChartAreaInteractive } from "./ChartAreaInteractive";

export function AuditEmptyState() {
  return (
    <div className="flex flex-1 flex-col space-y-6">
      <ChartAreaInteractive
        data={[]}
        title="See what AI is talking about your prompts"
        description="Input needed to display chart"
        showTimeRange={false}
        emptyMessage="Input needed to display chart"
        emptyHint="Select a data source"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-2xl font-semibold text-zinc-900">—</p>
          <p className="text-sm text-zinc-600">Your mentions</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-2xl font-semibold text-zinc-900">—</p>
          <p className="text-sm text-zinc-600">Competitors</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-2xl font-semibold text-zinc-900">—</p>
          <p className="text-sm text-zinc-600">Prompts good for your website</p>
        </div>
      </div>
    </div>
  );
}
