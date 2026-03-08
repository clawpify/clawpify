import { copy } from "../utils/copy";

export function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="text-center text-3xl font-bold text-zinc-900">
          {copy.howItWorks.title}
        </h2>
        <div className="mt-16 grid gap-12 sm:grid-cols-3">
          {copy.howItWorks.steps.map(({ number, title, desc }) => (
            <div key={number} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-600">
                {number}
              </div>
              <h3 className="mt-4 font-semibold text-zinc-900">{title}</h3>
              <p className="mt-2 text-sm text-zinc-600">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
