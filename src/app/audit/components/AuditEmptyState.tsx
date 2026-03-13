import { CalendarIcon, ChartBarIcon } from "../../../icons/audit-icons";
import { ChartAreaInteractive } from "./ChartAreaInteractive";

export function AuditEmptyState() {
  return (
    <div className="flex flex-1 flex-col space-y-4">
      <ChartAreaInteractive
        data={[]}
        title="Brand Visibility in ChatGPT"
        description="Input needed to display chart"
        showTimeRange={false}
        emptyMessage="Input needed to display chart"
        emptyHint="Select a data source"
      />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
        <section className="flex min-w-0 flex-1 flex-col">
          <div className="mb-4 shrink-0">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Query Visibility
            </h3>
          </div>
          <div className="flex min-h-[250px] flex-1 flex-col items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50/50">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-zinc-50/50 text-zinc-500">
              <CalendarIcon size={32} />
            </div>
            <p className="mt-3 text-sm font-medium text-zinc-900">
              Input needed to display chart
            </p>
            <p className="mt-1 text-sm text-zinc-500">Select a data source</p>
          </div>
        </section>

        <section className="flex min-w-0 flex-1 flex-col">
          <div className="mb-4 shrink-0">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Citations
            </h3>
          </div>
          <div className="flex min-h-[250px] flex-1 flex-col items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50/50">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-zinc-50/50 text-zinc-500">
              <ChartBarIcon size={32} />
            </div>
            <p className="mt-3 text-sm font-medium text-zinc-900">
              Input needed to display chart
            </p>
            <p className="mt-1 text-sm text-zinc-500">Select a data source</p>
          </div>
        </section>
      </div>
    </div>
  );
}
