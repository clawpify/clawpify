import { copy } from "../../utils/copy";

export function ContentEditor() {
  return (
    <div className="flex-1 overflow-auto px-6 py-4">
      <div className="mx-auto max-w-2xl rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-gray-900">
          {copy.content.title}
        </h2>
        <p className="mt-1 text-sm text-gray-500">{copy.content.desc}</p>
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {copy.content.metaTitle}
            </label>
            <input
              type="text"
              placeholder={copy.content.metaTitlePlaceholder}
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {copy.content.metaDesc}
            </label>
            <textarea
              rows={3}
              placeholder={copy.content.metaDescPlaceholder}
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <p className="text-sm text-gray-400">{copy.content.empty}</p>
        </div>
      </div>
    </div>
  );
}
