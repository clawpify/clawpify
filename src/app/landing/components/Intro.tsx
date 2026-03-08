import { copy } from "../utils/copy";

export function Intro() {
  return (
    <section className="pt-20 pb-16 md:pt-28 md:pb-24">
      <div className="max-w-6xl px-6 md:px-10 lg:px-12">
        <div className="grid gap-6 md:grid-cols-2 md:items-start md:gap-20">
          <h2 className="text-xl font-semibold leading-snug tracking-tight text-zinc-900 md:text-[1.5rem] lg:text-[1.75rem]">
            {copy.intro.heading}
          </h2>
          <p className="text-[0.9375rem] leading-relaxed text-zinc-600 md:text-[1rem]">
            {copy.intro.paragraph}
          </p>
        </div>
      </div>
    </section>
  );
}
