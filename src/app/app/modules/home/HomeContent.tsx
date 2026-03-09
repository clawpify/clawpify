import { copy } from "../../utils/copy";

export function HomeContent() {
  return (
    <div className="flex-1 overflow-auto px-6 py-4">
      <div className="mx-auto max-w-2xl rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-gray-900">
          {copy.home.title}
        </h2>
        <p className="mt-1 text-sm text-gray-500">{copy.home.desc}</p>
      </div>
    </div>
  );
}
