import { copy } from "../../utils/copy";

export function StoresTable() {
  return (
    <div className="flex-1 overflow-auto px-6 py-4">
      <div className="rounded-lg border border-gray-200 bg-white">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                {copy.storesTable.columns.name}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                {copy.storesTable.columns.health}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                {copy.storesTable.columns.status}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                {copy.storesTable.columns.products}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                {copy.storesTable.columns.lastSync}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100 transition hover:bg-gray-50">
              <td colSpan={5} className="px-4 py-12 text-center">
                <div className="mx-auto max-w-sm">
                  <p className="text-sm font-medium text-gray-900">
                    {copy.storesTable.empty}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {copy.storesTable.emptyDesc}
                  </p>
                  <button
                    type="button"
                    className="mt-4 rounded-md bg-[#2563eb] px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
                  >
                    Connect store
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
