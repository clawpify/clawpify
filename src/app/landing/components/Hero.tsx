import { copy } from "../utils/copy";

export function Hero() {
  return (
    <section className="hero-bg relative overflow-hidden pt-24 pb-28 md:pt-32 md:pb-40">
      <div className="mx-auto max-w-6xl px-6 md:px-10 lg:px-12">
        <h1 className="hero-headline max-w-4xl text-3xl font-medium leading-[1.1] tracking-tight text-zinc-900 sm:text-4xl md:text-5xl lg:text-[3.5rem] xl:text-[4rem] 2xl:text-[4.5rem]">
          {copy.hero.headline}
        </h1>
      </div>
    </section>
  );
}
