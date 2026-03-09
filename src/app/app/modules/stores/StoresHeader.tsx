import { copy } from "../../utils/copy";

export function StoresHeader() {
  return (
    <header className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-gray-900">
            {copy.header.title}
          </h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              {copy.header.filter}
            </button>
            <button
              type="button"
              className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              {copy.header.display}
            </button>
          </div>
        </div>
        <button
          type="button"
          className="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
        >
          + {copy.header.newStore}
        </button>
      </div>
      <div className="mt-4 flex gap-4 border-b border-gray-200">
        <button
          type="button"
          className="border-b-2 border-[#2563eb] pb-2 text-sm font-medium text-[#2563eb]"
        >
          {copy.header.allStores}
        </button>
        <button
          type="button"
          className="pb-2 text-sm font-medium text-gray-500 transition hover:text-gray-700"
        >
          + {copy.header.newView}
        </button>
      </div>
    </header>
  );
}
