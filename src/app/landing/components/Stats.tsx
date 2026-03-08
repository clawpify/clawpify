import { copy } from "../utils/copy";

export function Stats() {
  const stats = [
    { value: copy.stats.stores, label: copy.stats.storesLabel },
    { value: copy.stats.lift, label: copy.stats.liftLabel },
    { value: copy.stats.platforms, label: copy.stats.platformsLabel },
  ];

  return (
    <section className="border-y border-zinc-200 bg-zinc-50/80 py-12">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-12 px-6">
        {stats.map(({ value, label }) => (
          <div key={label} className="text-center">
            <div className="text-3xl font-bold text-indigo-600">{value}</div>
            <div className="mt-1 text-sm text-zinc-600">{label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
