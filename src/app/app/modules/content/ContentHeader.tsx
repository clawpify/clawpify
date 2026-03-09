import { copy } from "../../utils/copy";

export function ContentHeader() {
  return (
    <header className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-lg font-semibold text-gray-900">
          {copy.content.header}
        </h1>
        <button
          type="button"
          className="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
        >
          + {copy.content.newContent}
        </button>
      </div>
    </header>
  );
}
