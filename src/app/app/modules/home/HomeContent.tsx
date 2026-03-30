import { copy } from "../../utils/copy";

export function HomeContent() {
  return (
    <div className="flex-1 overflow-auto px-6 py-8">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-xl font-semibold text-zinc-900">{copy.home.title}</h2>
        <p className="mt-2 text-sm text-zinc-500">{copy.home.desc}</p>
      </div>
    </div>
  );
}
