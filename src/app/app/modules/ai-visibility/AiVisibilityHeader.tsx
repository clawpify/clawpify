import { copy } from "../../utils/copy";

export function AiVisibilityHeader() {
  return (
    <header className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
      <h1 className="text-lg font-semibold text-gray-900">
        {copy.aiVisibility.header}
      </h1>
    </header>
  );
}
