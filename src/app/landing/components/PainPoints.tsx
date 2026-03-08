import { copy } from "../utils/copy";

export function PainPoints() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="text-center text-3xl font-bold text-zinc-900">
          {copy.painPoints.title}
        </h2>
        <ul className="mt-8 space-y-4">
          {copy.painPoints.items.map((item) => (
            <li key={item} className="flex items-center gap-3 text-zinc-600">
              <span className="text-indigo-500">×</span>
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-8 text-center text-lg font-medium text-indigo-600">
          {copy.painPoints.solution}
        </p>
      </div>
    </section>
  );
}
