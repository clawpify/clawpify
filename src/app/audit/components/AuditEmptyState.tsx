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

      <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
        <section className="flex min-w-0 flex-1 flex-col">
          <div className="mb-4 shrink-0">
            <div className="h-5 w-32 animate-pulse rounded bg-zinc-200" />
            <div className="mt-1 h-4 w-48 animate-pulse rounded bg-zinc-100" />
          </div>
          <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-zinc-200 bg-white">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Query
                  </th>
                  <th className="w-10 px-4 py-3" aria-hidden />
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr
                    key={i}
                    className="border-b border-zinc-100 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <div className="h-4 w-24 animate-pulse rounded bg-zinc-200" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-full max-w-[200px] animate-pulse rounded bg-zinc-200" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-5 w-5 animate-pulse rounded bg-zinc-100" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="flex min-w-0 flex-1 flex-col">
          <div className="mb-4 shrink-0">
            <div className="h-5 w-24 animate-pulse rounded bg-zinc-200" />
            <div className="mt-1 h-4 w-56 animate-pulse rounded bg-zinc-100" />
          </div>
          <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-zinc-200 bg-white">
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
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr
                    key={i}
                    className="border-b border-zinc-100 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <div className="h-4 w-4 animate-pulse rounded bg-zinc-200" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 shrink-0 animate-pulse rounded bg-zinc-200" />
                        <div className="h-4 w-20 animate-pulse rounded bg-zinc-200" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-8 animate-pulse rounded bg-zinc-200" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-6 animate-pulse rounded bg-zinc-200" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-4 animate-pulse rounded bg-zinc-200" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
